<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { toast } from "svelte-sonner";
    import { setMode } from "mode-watcher";
    import {
        ChartSpline,
        RefreshCcwDot,
        CloudDownload,
        Key,
        Copy,
        EyeOff,
        Eye,
        ChevronLeft,
        ChevronRight,
    } from "@lucide/svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import { Spinner } from "$lib/components/ui/spinner/index.js";
    import { PUBLIC_API_V1_URL } from "$env/static/public";
    import type {
        Report,
        ApiResponse,
        DashboardData,
        GeneratedKey,
        Stats,
    } from "$lib/types";

    // Environment
    let bunEnvironment = import.meta.env.MODE || "development";

    // State
    let apiKey = $state("");
    let environment = $state("");
    let allData: Report[] = $state([]);
    let loading = $state(true);
    let showModal = $state(false);
    let generating = $state(false);
    let refreshing = $state(false);
    let keyName = $state("");
    let keyDescription = $state("");
    let generatedKey = $state("");
    let generatedKeyData = $state<GeneratedKey | null>(null);
    let showKey = $state(false);
    let keyTimeout = $state<any>(null);

    // Pagination state
    let currentPage = $state(1);
    let itemsPerPage = $state(50);
    let totalItems = $state(0);
    let hasMore = $state(false);

    let stats = $state<Stats>({
        avgUptime: 0,
        avgLatency: 0,
        totalReports: 0,
        incidents: 0,
    });

    // Constants
    const STORAGE_KEY = "apiKey";
    const keyPlaceholder = "*".repeat(50);

    const stars = Array.from({ length: 500 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 3,
        duration: Math.random() * 3 + 2,
    }));

    // Derived state
    let uptimeChartData = $derived(
        allData.slice(-20).map((r) => ({
            time: new Date(r.timestamp).toLocaleTimeString(),
            uptime: r.uptime_percent,
        })),
    );

    let totalUp = $derived(allData.reduce((sum, r) => sum + r.uptime_count, 0));
    let totalDown = $derived(
        allData.reduce((sum, r) => sum + r.downtime_count, 0),
    );
    let totalDegraded = $derived(
        allData.reduce((sum, r) => sum + r.degraded_count, 0),
    );

    let totalPages = $derived(Math.ceil(totalItems / itemsPerPage));
    let canGoPrevious = $derived(currentPage > 1);
    let canGoNext = $derived(hasMore || currentPage < totalPages);

    // API Functions
    async function generateKey() {
        if (!keyName.trim()) {
            toast.error("Please enter a key name", { duration: 3000 });
            return;
        }

        const url = `${PUBLIC_API_V1_URL}/keys/generate`;
        generating = true;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: keyName,
                    description: keyDescription || undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.message || "Failed to generate API key",
                );
            }

            const result: ApiResponse<GeneratedKey> = await response.json();

            if (result.success) {
                generatedKey = result.data.api_key;
                generatedKeyData = result.data;
                toast.success(result.message, { duration: 10000 });

                if (result.data.warning) {
                    toast.warning(result.data.warning, { duration: 6000 });
                }
            } else {
                throw new Error(result.message || "Failed to generate key");
            }
        } catch (error: any) {
            toast.error("Error generating key: " + error.message, {
                duration: 4000,
            });
        } finally {
            generating = false;
        }
    }

    async function loadDashboard(
        key = apiKey,
        env = environment,
        page = currentPage,
    ) {
        if (!key) {
            toast.error("Please enter your API key", { duration: 6000 });
            return;
        }

        loading = true;
        refreshing = true;

        const offset = (page - 1) * itemsPerPage;
        const url = `${PUBLIC_API_V1_URL}/dashboard/data`;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${key}`,
                },
                body: JSON.stringify({
                    environment: env || "",
                    limit: itemsPerPage,
                    offset: offset,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.message ||
                        "Failed to fetch data. Check your API key.",
                );
            }

            const result: ApiResponse<DashboardData> = await response.json();
            const { data, pagination } = result.data;

            allData = data;
            totalItems = pagination.total;
            hasMore = pagination.hasMore;

            if (allData.length === 0) {
                toast.info("No data available for the selected environment.", {
                    duration: 6000,
                });
            } else {
                updateStats(allData);
            }

            loading = false;
        } catch (error: any) {
            toast.error("Error loading dashboard: " + error.message, {
                duration: 6000,
            });
            console.error("Load dashboard error:", error);
            loading = true;
        } finally {
            refreshing = false;
        }
    }

    // Utility Functions
    function updateStats(data: Report[]) {
        if (data.length === 0) {
            stats = {
                avgUptime: 0,
                avgLatency: 0,
                totalReports: totalItems,
                incidents: 0,
            };
            return;
        }

        const avgUptime =
            data.reduce((sum, r) => sum + r.uptime_percent, 0) / data.length;
        const avgLatency =
            data.reduce((sum, r) => sum + r.average_latency_ms, 0) /
            data.length;
        const incidents = data.reduce((sum, r) => sum + r.downtime_count, 0);

        stats = {
            avgUptime: parseFloat(avgUptime.toFixed(2)),
            avgLatency: parseFloat(avgLatency.toFixed(2)),
            totalReports: totalItems,
            incidents,
        };
    }

    function handleApiKeyChange(e: Event) {
        const target = e.target as HTMLInputElement;
        apiKey = target.value;
        localStorage.setItem(STORAGE_KEY, apiKey);
    }

    function copyKey() {
        if (!generatedKey) {
            toast.error("No API key to copy", { duration: 2000 });
            return;
        }

        navigator.clipboard
            .writeText(generatedKey)
            .then(() => {
                toast.success("API key copied to clipboard", {
                    duration: 4000,
                });

                if (keyTimeout) return;

                keyTimeout = setTimeout(() => {
                    generatedKey = "";
                    keyTimeout = null;
                }, 10000);
            })
            .catch(() => {
                toast.error("Failed to copy API key", { duration: 4000 });
            });
    }

    function resetKeyModal() {
        keyName = "";
        keyDescription = "";
        generatedKey = "";
        generatedKeyData = null;
        showKey = false;
    }

    function exportData() {
        if (allData.length === 0) {
            toast.error("No data to export", { duration: 5000 });
            return;
        }

        const csv =
            "Timestamp,Environment,Uptime%,Latency,Up,Down,Degraded\n" +
            allData
                .map(
                    (r) =>
                        `${r.timestamp},${r.environment},${r.uptime_percent},${r.average_latency_ms},${r.uptime_count},${r.downtime_count},${r.degraded_count}`,
                )
                .join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `uptime-report-${new Date().toISOString()}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        toast.success("Data exported successfully", { duration: 2000 });
    }

    // Pagination Functions
    function goToPage(page: number) {
        if (page < 1 || page > totalPages) return;
        currentPage = page;
        loadDashboard(apiKey, environment, page);
    }

    function nextPage() {
        if (canGoNext) {
            goToPage(currentPage + 1);
        }
    }

    function previousPage() {
        if (canGoPrevious) {
            goToPage(currentPage - 1);
        }
    }

    // Lifecycle
    onMount(() => {
        if (bunEnvironment !== "development") {
            goto("/", { replaceState: true });
            return;
        }

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            apiKey = saved;
            loadDashboard(saved, "", 1);
        }
        setMode("dark");
        console.log(bunEnvironment);
    });
</script>

<svelte:head>
    <title>Dashboard Monitor</title>
</svelte:head>

<!-- Dashboard -->
<div
    class="min-h-screen bg-[#222] text-white relative overflow-hidden font-code"
>
    <!-- Animated stars -->
    <div class="absolute inset-0 pointer-events-none">
        {#each stars as star (star.id)}
            <div
                class="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse"
                style="left: {star.left}%; top: {star.top}%; animation-delay: {star.delay}s; animation-duration: {star.duration}s;"
            ></div>
        {/each}
    </div>

    <div class="relative z-10 max-w-7xl mx-auto p-6">
        <!-- Header -->
        <div
            class="text-center mb-10 border p-10 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-neutral-900 hover:shadow-lg transition-shadow"
        >
            <h1 class="text-4xl font-bold mb-2 inline-flex items-center gap-2">
                <ChartSpline class="size-10 text-purple-600" />
                UPTIME MONITOR
            </h1>
            <p class="text-gray-200 text-sm">
                REAL-TIME MONITORING - AXIOLOT HUB
            </p>
        </div>

        <!-- API Key -->
        <div
            class="mb-6 border space-y-4 border-yellow-400 p-4 bg-neutral-900 rounded-[40%_60%_70%_30%/50%_60%_30%_60%] py-8"
        >
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="text-yellow-400 pb-2 text-lg">⚠️ API KEY</label>
            <input
                type="password"
                class="w-full bg-neutral-950 border border-slate-600 md:ml-4 md:w-3/4 mx-auto text-white p-3 rounded-xl outline-none focus:border-gray-500"
                bind:value={apiKey}
                oninput={handleApiKeyChange}
                placeholder="axh_..."
            />
        </div>

        <!-- Controls -->
        <div class="flex flex-wrap gap-4 mb-6">
            <select
                bind:value={environment}
                onchange={() => {
                    currentPage = 1;
                    loadDashboard();
                }}
                class="bg-neutral-900 border border-gray-700 p-3 rounded-xl text-white focus:border-gray-500 outline-none"
            >
                <option value="">ALL ENVIRONMENTS</option>
                <option value="production">PRODUCTION</option>
                <option value="staging">STAGING</option>
                <option value="development">DEVELOPMENT</option>
            </select>
            <button
                disabled={refreshing}
                onclick={() => loadDashboard()}
                class="bg-neutral-900 border border-slate-700 px-6 py-3 rounded-xl hover:-translate-y-0.5 transition hover:shadow-xl cursor-pointer inline-flex items-center gap-x-2 disabled:pointer-events-none disabled:opacity-60"
            >
                <RefreshCcwDot
                    class="size-6 text-teal-400 {refreshing
                        ? 'animate-spin'
                        : ''}"
                /> REFRESH
            </button>
            <button
                onclick={exportData}
                disabled={allData.length === 0}
                class="bg-neutral-900 border border-slate-700 px-6 py-3 rounded-xl hover:-translate-y-0.5 transition hover:shadow-xl cursor-pointer inline-flex items-center gap-x-2 disabled:pointer-events-none disabled:opacity-50"
            >
                <CloudDownload class="size-6 text-amber-500" /> EXPORT CSV
            </button>
            <Dialog.Root
                bind:open={showModal}
                onOpenChange={(open) => {
                    if (!open) resetKeyModal();
                }}
            >
                <Dialog.Trigger
                    disabled={generating}
                    onclick={() => (showModal = true)}
                    class="bg-neutral-900 border border-slate-700 px-6 py-3 rounded-xl hover:-translate-y-0.5 transition hover:shadow-xl cursor-pointer inline-flex items-center gap-x-2 disabled:pointer-events-none disabled:opacity-50"
                >
                    <Key class="size-6 text-green-500" />
                    {generating ? "CREATING KEY" : "CREATE KEY"}
                </Dialog.Trigger>
                <Dialog.Content
                    class="sm:max-w-[625px] font-code"
                    onInteractOutside={(e) => {
                        if (generating) e.preventDefault();
                    }}
                >
                    <Dialog.Header>
                        <Dialog.Title>Generate API Key</Dialog.Title>
                        <Dialog.Description
                            class="text-slate-400 my-4 mb-2 font-code"
                        >
                            Note: Generating a new API key will require you to
                            delete the existing one from your database in
                            Supabase.
                        </Dialog.Description>
                    </Dialog.Header>
                    <div
                        class="mx-auto sm:max-w-[500px] w-full my-4 mt-1 space-y-5"
                    >
                        <input
                            type="text"
                            class="w-full font-code bg-neutral-950 border border-slate-600 mx-auto text-white p-3 rounded-xl outline-none focus:border-gray-500"
                            bind:value={keyName}
                            placeholder="Key Name *"
                            disabled={generating || !!generatedKey}
                        />
                        <textarea
                            class="w-full font-code bg-neutral-950 resize-none border border-slate-600 mx-auto text-white p-3 rounded-xl outline-none focus:border-gray-500"
                            bind:value={keyDescription}
                            placeholder="Key Description (Optional)"
                            rows="2"
                            disabled={generating || !!generatedKey}
                        ></textarea>
                        {#if generatedKey}
                            <div
                                class="grid grid-cols-12 items-center justify-between gap-x-2"
                            >
                                <div
                                    class="col-span-10 rounded-xl border-slate-700 border py-2 px-1"
                                >
                                    <p class="text-nowrap truncate px-1">
                                        {#if showKey}
                                            {generatedKey}
                                        {:else}
                                            {keyPlaceholder}
                                        {/if}
                                    </p>
                                </div>
                                <div
                                    class="col-span-2 gap-x-2 flex flex-row justify-between items-center py-2 ml-2"
                                >
                                    <div>
                                        <Copy
                                            onclick={copyKey}
                                            class="size-5 cursor-pointer hover:text-green-400 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        {#if showKey}
                                            <EyeOff
                                                onclick={() =>
                                                    (showKey = false)}
                                                class="size-5 cursor-pointer hover:text-blue-400 transition-colors"
                                            />
                                        {:else}
                                            <Eye
                                                onclick={() => (showKey = true)}
                                                class="size-5 cursor-pointer hover:text-blue-400 transition-colors"
                                            />
                                        {/if}
                                    </div>
                                </div>
                            </div>
                            {#if generatedKeyData?.warning}
                                <p class="text-yellow-400 text-sm">
                                    ⚠️ {generatedKeyData.warning}
                                </p>
                            {/if}
                        {/if}
                    </div>
                    <Dialog.Footer>
                        {#if !generatedKey}
                            <Button
                                type="submit"
                                class="cursor-pointer"
                                onclick={generateKey}
                                disabled={generating}
                            >
                                {#if generating}
                                    <Spinner class="size-4 text-black" /> Generating
                                {:else}
                                    Generate Key
                                {/if}
                            </Button>
                        {:else}
                            <Button
                                type="button"
                                variant="outline"
                                onclick={() => (showModal = false)}
                            >
                                Close
                            </Button>
                        {/if}
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Root>
        </div>

        <!-- Stats Grid -->
        <div class="grid md:grid-cols-4 sm:grid-cols-2 gap-4 mb-8">
            <div
                class="border border-slate-700 p-6 bg-neutral-900 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] text-center transition hover:shadow-xl hover:-translate-y-0.5"
            >
                <div class="text-gray-400 text-xs mb-1">AVG. UPTIME</div>
                <div class="text-3xl font-bold">{stats.avgUptime}%</div>
            </div>
            <div
                class="border border-slate-700 p-6 bg-neutral-900 rounded-[40%_60%_70%_30%/50%_60%_30%_60%] text-center transition hover:shadow-xl hover:-translate-y-0.5"
            >
                <div class="text-gray-400 text-xs mb-1">AVG. LATENCY</div>
                <div class="text-2xl font-bold">
                    {stats.avgLatency}<span class="text-lg">ms</span>
                </div>
            </div>
            <div
                class="border border-gray-700 p-6 bg-neutral-900 rounded-[48%_52%_68%_32%/42%_28%_72%_58%] text-center transition hover:shadow-xl hover:-translate-y-0.5"
            >
                <div class="text-gray-400 text-xs mb-1">TOTAL REPORTS</div>
                <div class="text-3xl font-bold">{stats.totalReports}</div>
            </div>
            <div
                class="border border-gray-700 p-6 bg-neutral-900 rounded-[30%_70%_70%_30%/30%_30%_70%_70%] text-center transition hover:shadow-xl hover:-translate-y-0.5"
            >
                <div class="text-gray-400 text-xs mb-1">INCIDENTS</div>
                <div class="text-3xl font-bold text-red-400">
                    {stats.incidents}
                </div>
            </div>
        </div>

        <!-- Charts -->
        <div class="grid md:grid-cols-2 gap-6 mb-8">
            <div
                class="border border-gray-700 p-6 bg-neutral-900 rounded-[60%_40%_30%_70%/60%_30%_70%_40%]"
            >
                <h2 class="text-gray-300 text-sm mb-4">UPTIME TREND</h2>
                <div
                    class="h-64 bg-linear-to-tr from-neutral-800 to-neutral-900 rounded-md flex items-center justify-center text-gray-300 border border-slate-700 hover:shadow-xl transition-shadow"
                >
                    Chart requires Recharts<br />({uptimeChartData.length} points)
                </div>
            </div>
            <div
                class="border border-gray-700 p-6 bg-neutral-900 rounded-[40%_60%_70%_30%/50%_60%_30%_60%]"
            >
                <h2 class="text-gray-300 text-sm mb-4">STATUS DISTRIBUTION</h2>
                <div
                    class="h-64 bg-linear-to-bl from-neutral-800 to-neutral-900 rounded-md flex items-center justify-center text-gray-300 border border-slate-700 hover:shadow-xl transition-shadow"
                >
                    Up: {totalUp} | Down: {totalDown} | Degraded: {totalDegraded}
                </div>
            </div>
        </div>

        <!-- Reports Table -->
        <div
            class="border border-slate-700 p-6 bg-neutral-900 rounded-[48%_52%_68%_32%/42%_28%_72%_58%]"
        >
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-gray-300 text-sm">RECENT REPORTS</h2>
                {#if !loading && allData.length > 0}
                    <div class="text-xs text-gray-400">
                        Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(
                            currentPage * itemsPerPage,
                            totalItems,
                        )} of {totalItems}
                    </div>
                {/if}
            </div>

            {#if !loading}
                <div class="text-center py-12 text-gray-300 animate-pulse">
                    LOADING DATA...
                </div>
            {:else if allData.length === 0}
                <div class="text-center py-12 text-gray-400">
                    No reports found
                </div>
            {:else}
                <div class="overflow-x-auto">
                    <table
                        class="w-full text-sm bg-black h-full rounded-t-md shadow-xl"
                    >
                        <thead class="border-b border-slate-700 text-gray-300">
                            <tr class="px-3">
                                <th class="text-left py-2 pl-4">TIMESTAMP</th>
                                <th class="text-left py-2">ENV</th>
                                <th class="text-left py-2">UPTIME_%</th>
                                <th class="text-left py-2">LATENCY</th>
                                <th class="text-left py-2">STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each allData as report (report.timestamp + report.environment)}
                                <tr
                                    class="border-b border-neutral-800 hover:bg-neutral-950 transition-colors"
                                >
                                    <td class="py-2 pl-4"
                                        >{new Date(
                                            report.timestamp,
                                        ).toLocaleString()}</td
                                    >
                                    <td class="text-gray-400 py-2"
                                        >{report.environment}</td
                                    >
                                    <td class="py-2"
                                        >{report.uptime_percent.toFixed(2)}%</td
                                    >
                                    <td class="py-2"
                                        >{report.average_latency_ms.toFixed(
                                            2,
                                        )}ms</td
                                    >
                                    <td class="py-2">
                                        <span
                                            class="bg-green-900 text-green-300 text-xs px-2 py-1 rounded mr-1"
                                            >{report.uptime_count}↑</span
                                        >
                                        <span
                                            class="bg-red-900 text-red-300 text-xs px-2 py-1 rounded mr-1"
                                            >{report.downtime_count}↓</span
                                        >
                                        <span
                                            class="bg-yellow-900 text-yellow-300 text-xs px-2 py-1 rounded"
                                            >{report.degraded_count}~</span
                                        >
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>

                <!-- Pagination Controls -->
                <div
                    class="flex justify-between items-center mt-4 pt-4 border-t border-slate-700"
                >
                    <button
                        onclick={previousPage}
                        disabled={!canGoPrevious || refreshing}
                        class="bg-neutral-800 border border-slate-600 px-4 py-2 rounded-lg hover:bg-neutral-700 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                    >
                        <ChevronLeft class="size-4" /> Previous
                    </button>

                    <div class="flex items-center gap-2">
                        <span class="text-sm text-gray-400">
                            Page {currentPage} of {totalPages}
                        </span>
                    </div>

                    <button
                        onclick={nextPage}
                        disabled={!canGoNext || refreshing}
                        class="bg-neutral-800 border border-slate-600 px-4 py-2 rounded-lg hover:bg-neutral-700 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                    >
                        Next <ChevronRight class="size-4" />
                    </button>
                </div>
            {/if}
        </div>
    </div>
</div>

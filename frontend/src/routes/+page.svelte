<script lang="ts">
	import { onMount } from "svelte";
	import { setMode } from "mode-watcher";

	onMount(() => {
		setMode("system");
	});
</script>

<div class="bg-slate-50 dark:bg-black min-h-screen">
	<div class="container mx-auto p-4">
		<div class="flex justify-between items-center">
			<div></div>
			<div></div>
		</div>
	</div>
</div>

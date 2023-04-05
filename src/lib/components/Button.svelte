<script>
	let data;
	export let type = "button";
	export let shareBtn;

</script>
<button {type} on:click>
	<slot />
</button>
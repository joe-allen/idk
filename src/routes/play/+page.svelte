<script>
	/** @type {import('./$types').PageData} */
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import places from '../Store';

	import ClipboardJS from 'clipboard';
	import Button from '$lib/components/Button.svelte';

	export let data;
	export let form;

	let url;
	let zip;
	let userId;
	let copyBtn;
	let loading;
	let shareBtn;
	let hasShare;
	let category;
	let pageTitle;
	let showControls;
	$: loading = false;

	onMount(() => {
		// check if form exists
		// and error free
		console.log('form', form);
		if (form && !form.error) {
			loading = false;
			pageTitle = form.cat;
			showControls = !showControls
			url = `${window.location}/${form.results.slug}`;
			copyBtn.dataset.clipboardText = url;
		}

		if (navigator.share) {
			hasShare = true;
		}
	});

	function share(e) {
		e.preventDefault();

		const title = document.title;
		const url = window.location.href;

		navigator.share( {
			title,
			url,
		} ).then( () => {
			shareShowMessage( shareBtn, 'Nice!' );
		} ).error( () => {
			console.log( 'here' );
			shareShowMessage( shareBtn, 'Nope!' );
		} );
	};

	// copy to clipboard
	function copyLink(e) {
		let clipboard = new ClipboardJS('.b-copy-link');
		clipboard.on('success', function(e) {
			return;
		});
	}

	// send user to page
	// w/ results
	function play() {
		if (form && !form.error) {
			if (!window.localStorage.getItem('userId')) {
				userId = crypto.randomUUID();
				window.localStorage.setItem('userId', userId);
			}

			// store places in Store.js
			places.update(() => {
				return {
					form,
					userId
				}
			});
		}

		// got to results
		goto(url);
	}

	// while loading
	function showLoading() {
		if (category && zip.value) {
			loading = true;
		}
	}

	// reset form
	function hideControls() {
		if (form) {
			showControls = false;
		}
	}

</script>

<svelte:head>
	<title>Let's Play IDK</title>
</svelte:head>

<!--
<h1>How To Play:</h1>
<ol>
	<li>Select a category</li>
	<li>Set you zip code</li>
	<li>Click "Find Locations"</li>
	<li>Copy the link</li>
	<li>Send to a friend</li>
	<li>Start the game</li>
</ol> -->

<form method="POST" class="b-form">
	<h3>Select a category</h3>
	<select name="cat" value={form?.cat ?? ''}>
		<option disabled>Select</option>
		<option value="restaurant">Eat</option>
		<option value="bar">Drink</option>
		<option value="museum">Learn</option>
	</select>

	<label for="zip">
		<h3>Enter zip code</h3>
		<input on:click|once={hideControls} bind:this={zip} type="text" name="zip" id="zip" minlength="5" maxlength="5" required value={form?.zip ?? ''}>
	</label>

	<div class="b-form__submit-wrap">
		<Button type="submit" on:click={showLoading}>Find Locations</Button>
		{#if loading}
			<svg class="b-form__submit-loading-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,176A72,72,0,0,1,92,65.64a8,8,0,0,1,8,13.85,56,56,0,1,0,56,0,8,8,0,0,1,8-13.85A72,72,0,0,1,128,200Z"/></svg>
		{/if}
	</div>

	{#if form && form.error }
		<div>{form.message}</div>
	{/if}
</form>

<!-- show share, copy and play btns -->
{#if form && !form.error }

	<!-- add check here to hide controls if cat or zip changed -->
	<div style="display: {showControls ? 'block' : 'none'};">
		{#if hasShare}
				<button type="button" bind:this={shareBtn} name="cool" on:click={share}>Share</button>
		{:else}
			<button
				class="b-copy-link"
				bind:this={copyBtn}
				on:click|once={copyLink}
				data-clipboard-text='ok'
			>
				Copy Link
			</button>
		{/if}
		<Button on:click={play}>Play game!</Button>
	</div>
{/if}

<style lang="postcss">

	.b-form__submit-wrap {
		display: flex;
		place-items: center;
		gap: var(--size-2);
	}

	.b-form__submit-loading-icon {
		fill: var(--text-1);
		width: 32px;
		height: 32px;
		animation: spin 1.5s linear forwards infinite;
	}

	li {
		padding: var(--size-1) var(--size-2);
		margin-block-start: var(--size-2);
	}

	input[type="radio"] {
		transform: scale(1.5);
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
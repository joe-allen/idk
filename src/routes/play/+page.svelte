<script>
	/** @type {import('./$types').PageData} */
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { fade, blur, fly, slide, scale } from "svelte/transition";
	import { linear, backInOut } from 'svelte/easing';
	import places from '../Store';

	import ClipboardJS from 'clipboard';

	import Button from '$lib/components/Button.svelte';
	import Header from '$lib/components/Header.svelte';

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

		const title = 'Let\'s Play! - IDK';
		const url = window.location.href;

		shareBtn.textContent = 'Shared!'

		navigator.share({
			title,
			url,
		}).then(() => {
			console.log('Nice');
		}).error(() => {
			console.log('Sorry, something went wrong sharing!');
		});
	};

	// copy to clipboard
	function copyLink(e) {
		let clipboard = new ClipboardJS('.b-copy-link');
		clipboard.on('success', function(e) {
			copyBtn.textContent = "Copied!"
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
		if (cat && zip.value) {
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

<Header />

<main>
	<div class="container">
		<section class="b-play">
			<div class="b-play__img-stack">
				<img class="b-play__img-img" src="/play/play-0.webp" alt="placeholder" width="300" height="400">
				<img class="b-play__img-img" src="/play/play-1.webp" alt="placeholder" width="300" height="400">
				<img class="b-play__img-img" src="/play/play-{data.randomImg}.webp" alt="placeholder" width="300" height="400">
			</div>
			<div class="b-play__form">
				{#if !showControls }
					 <form transition:fade={{duration: 300, easing: backInOut}} method="POST" class="b-form flow">
						 <div>
							 <label for="cat" class="flow">
								 <h3>Select a category</h3>
								 <select name="cat" id="cat" value={form?.cat ?? ''}>
									 <option disabled>Select</option>
									 <option value="restaurant">Eat</option>
									 <option value="bar">Drink</option>
									 <option value="museum">Learn</option>
								 </select>
							 </label>
						 </div>

						 <div>
							 <label for="zip" class="flow">
								 <h3>Enter zip code</h3>
								 <input on:click|once={hideControls} bind:this={zip} type="text" name="zip" id="zip" minlength="5" maxlength="5" required value={form?.zip ?? ''}>
							 </label>
						 </div>

						 <div class="b-form__submit-wrap">
							 <Button type="submit" on:click={showLoading}>Find Locations</Button>
							 {#if loading}
								 <svg transition:scale={{duration: 200, easing: linear}} class="b-form__submit-loading-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,176A72,72,0,0,1,92,65.64a8,8,0,0,1,8,13.85,56,56,0,1,0,56,0,8,8,0,0,1,8-13.85A72,72,0,0,1,128,200Z"/></svg>
							 {/if}
						 </div>

						 {#if form && form.error }
							 <div>{form.message}</div>
						 {/if}
					 </form>
				{/if}

				<!-- show share, copy and play btns -->
				{#if form && !form.error }
					{#if showControls }
						<!-- add check here to hide controls if cat or zip changed -->
						<div transition:fade="{{delay: 200, duration: 200, easing: backInOut}}" class="b-play__controls flow">
							<p class="b-play__controls-info">Alight, we've found {form.results.businesses.length} results ...</p>
							{#if hasShare}
									<button
										bind:this={shareBtn}
										on:click={share}
										class="b-play__button b-button--secondary"
										name="cool"
										type="button"
									>Share</button>
							{:else}
								<button
									bind:this={copyBtn}
									on:click|once={copyLink}
									class="b-copy-link b-play__button b-button--secondary"
									data-clipboard-text='ok'
								>Copy Link</button>
							{/if}
							<Button on:click={play}>Start!</Button>
						</div>
					{/if}
				{/if}
			</div>
		</section>
	</div>
</main>

<style lang="postcss">

	.b-play {
		display: flex;
		align-items: center;
		place-content: center;
		height: 100%;
		gap: 0;
	}

	.b-play__img-stack {
		position: relative;
		width: 55%;
	}

	.b-play__img-img {
		position: absolute;
		width: clamp(235px, 22vw, 600px);
		height: clamp(235px, 22vw, 600px);
		border-radius: var(--radius-3);
		object-fit: cover;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		border: 8px solid var(--text-1);

		&:nth-of-type(2) {
			transform: translate(-50%, -50%) rotate(-24deg) scale(.95);
			opacity: .95;
			border: 8px solid var(--text-1);
		}

		&:nth-of-type(1) {
			transform: translate(-50%, -50%) rotate(16deg) scale(.9);
			opacity: .9;
			border: 8px solid var(--text-1);
		}
	}

	.b-play__form {
		position: relative;
		flex-shrink: 0;
		width: 45%;
	}

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

	.b-play__controls {
		position: absolute;
		top: 50%;
		left: 0;
		transform: translateY(-50%);
		margin-block-start: var(--size-6);
		color: var(--surface-9);
	}

	.b-play__button {
		margin-inline-end: var(--size-2);
	}

	.b-play__controls-info {
		color: var(--text-1);
		font-weight: 600;
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

	@media screen and (max-width: 1200px) {
		.b-play {
			flex-direction: column;
			/* justify-content: space-evenly */
		}

		.b-play__img-stack {
			width: 100%;

			&::after {
				content: '';
				display: block;
				padding-bottom: 400px;
			}
		}

		.b-play__form {
			width: 100%;
			height: 50%;
			display: flex;
			align-items: flex-end;
			justify-content: center;
		}

		.b-play__controls {
			width: 100%;
			height: 50%;
			display: flex;
			align-items: center;
			flex-direction: column;
			justify-content: flex-end;
		}
	}
</style>
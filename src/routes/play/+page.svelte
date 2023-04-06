<script>
	import places from '../Store';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { linear, backInOut } from 'svelte/easing';
	import { fade, blur, fly, slide, scale } from "svelte/transition";

	import ClipboardJS from 'clipboard';

	import Button from '$lib/components/Button.svelte';
	import Header from '$lib/components/Header.svelte';

	/** @type {import('./$types').PageData} */
	export let data;
	export let form;

	let url;
	let zip;
	let userId;
	let copyBtn;
	let loading;
	let category;
	let shareBtn;
	let hasShare;
	let pageTitle;
	let showControls;
	$: loading = false;

	onMount(() => {
		// check if form exists
		// and error free
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
		const url = `${window.location}/${form.results.slug}`;

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
		if (category.value && zip.value) {
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

<main transition:fade={{duration: 1000, delay: 500, easing: backInOut}}>
	<div class="container">
		<section class="b-play">
			<div class="b-play__img-stack">
				<img class="b-play__img-img" src="/play/play-0.webp" alt="placeholder" width="400" height="400">
				<img class="b-play__img-img" src="/play/play-1.webp" alt="placeholder" width="400" height="400">
				<img class="b-play__img-img" src="/play/play-{data.randomImg}.webp" alt="placeholder" width="400" height="400">
			</div>
			<div class="b-play__form flow">
				{#if !showControls }
					<h2 class="b-play__form-title">Need <span>help deciding</span> what to do?</h2>
					<form transition:fade={{duration: 300, easing: backInOut}} method="POST" class="b-form flow">
						<div>
							<label for="cat" class="flow">
								<h3>Category</h3>
								<select name="cat" id="cat" value={form?.cat ?? ''} bind:this={category}>
									<option disabled>Select</option>
									<option value="restaurant">Eat</option>
									<option value="bar">Drink</option>
									<option value="museum">Learn</option>
								</select>
							</label>
						</div>

						<div>
							<label for="zip" class="flow">
								<h3>ZIP Code</h3>
								<input on:click|once={hideControls} bind:this={zip} type="text" name="zip" id="zip" minlength="5" maxlength="5" required value={form?.zip ?? ''}>
							</label>
						</div>

						<div class="b-form__submit-wrap">
							<Button type="submit" on:click={showLoading}>
								<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
							</Button>
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
					<!-- add check here to hide controls if cat or zip changed -->
					<div transition:fade="{{delay: 200, duration: 200, easing: backInOut}}" class={showControls ? 'b-play__controls--show b-play__controls flow' : 'b-play__controls flow'}>
						{#if form.results.businesses.length === 0}
							<p class="b-play__controls-info">Alright, we've found {form.results.businesses.length} results.</p>
							<button
								on:click={() => {
									window.location.reload();
								}}
								class="b-button b-button--secondary"
							>Try again</button
							>
						{:else}
							<p class="b-play__controls-info">Alright, we've found {form.results.businesses.length} results. Send the link to a friend. Then, start the game.</p>
							{#if hasShare}
									<button
										bind:this={shareBtn}
										on:click={share}
										class="b-play__button b-button b-button--secondary"
										name="cool"
										type="button"
									>Share</button>
							{:else}
								<button
									bind:this={copyBtn}
									on:click={copyLink}
									class="b-copy-link b-play__button b-button b-button--secondary"
									data-clipboard-text='Could not copy link'
								>Copy Link</button>
							{/if}
							<Button on:click={play}>Start!</Button>
						{/if}
					</div>
				{/if}
			</div>
		</section>
	</div>
</main>

<style lang="postcss">

	.b-play {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		align-items: center;
		place-content: center;
		gap: 0;
		height: 100%;
		width: 100vw;
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
		border: 8px solid var(--color-dark);

		&:nth-of-type(2) {
			transform: translate(-50%, -50%) rotate(-24deg) scale(.95);
			opacity: .95;
			border: 8px solid var(--color-dark);
		}

		&:nth-of-type(1) {
			transform: translate(-50%, -50%) rotate(16deg) scale(.9);
			opacity: .9;
			border: 8px solid var(--color-dark);
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
		margin-block-start: var(--step-2);
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
		opacity: 0;
		transition: opacity .5s .5s var(--ease-3);
	}

	.b-play__controls--show {
		opacity: 1;
	}

	.b-play__button {
		margin-inline-end: var(--size-2);
	}

	.b-play__controls-info {
		color: var(--text-1);
		width: 32ch;
		font-weight: 600;
	}

	li {
		padding: var(--size-1) var(--size-2);
		margin-block-start: var(--size-2);
	}

	input[type="radio"] {
		transform: scale(1.5);
	}

	.b-play__form-title {
		font-size: var(--step-2);
		width: 16ch;
		max-width: 100%;
		margin-block-end: var(--size-9);

		& span {
			color: var(--color-primary);
		}
	}

	h3 {
		color: var(--text-1);
		font-size: var(--step-0);
	}

	@media screen and (max-width: 1024px) {
		.b-play {
			flex-direction: column;
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
			gap: 2rem;
			justify-content: center;
		}

		.b-play__controls {
			width: 100%;
			height: 50%;
			display: flex;
			align-items: center;
			flex-direction: column;
			text-align: center;
			margin-block-start: 0;
		}

		.b-play__controls-info {
			max-width: 100%;
			margin-block: var(--step-1);
			width: 22ch;
		}

		.b-form__submit-wrap {
			display: flex;
			justify-content: flex-start;
			flex-direction: row-reverse;
		}

		.b-play__form-title {
			margin-block-start: .25em;
		}
	}

	@media screen and (max-width: 768px) {

		.b-play__img-stack {
			display: none;
		}

		.b-play__form {
			width: 100%;
			height: auto;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-direction: column;
		}

		.b-play__controls {
			width: 100%;
			height: auto;
			display: flex;
			align-items: center;
			flex-direction: column;
			justify-content: flex-end;
		}

		.b-play__form-title {
			text-align: center;
			margin-block-end: var(--size-4);
		}
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
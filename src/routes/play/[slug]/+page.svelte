<script>
	import places from '../../Store';
	import { onMount, tick } from 'svelte';
	import { backInOut } from 'svelte/easing';
	import { fade, blur, fly, slide, scale } from "svelte/transition";

	import { gsap } from 'gsap';
	import { supabase } from '$lib/supabaseClient.js';

	import Header from '$lib/components/Header.svelte';

	export let data;
	let mark;
	let match;
	let userId;
	let EsriMap;
	let showMap;
	let question;
	let yLocation;
	let nLocation;
	let businesses;
	let locationImg;
	let showUserItems;
	let userItems = [];

	$: match;

	// check Store
	// for places
	if ($places) {
		businesses = $places.form.results.businesses;
	} else {
		// get supabase api results from
		// slug param from w/in load fn
		// then randomize order of arr
		businesses = data.results.data[0].locations;
		function shuffleArray(businesses) {
			for (var i = businesses.length - 1; i > 0; i--) {
				var j = Math.floor(Math.random() * (i + 1));
				var temp = businesses[i];
				businesses[i] = businesses[j];
				businesses[j] = temp;
			}
		}
		shuffleArray(businesses);
	}

	onMount(async () => {
		const module = await import('../../../lib/components/Map.svelte');
		locationImg = document.querySelector('.b-location__stack img');

		EsriMap = module.default;

		// check svelte Store
		// for userID
		if ($places?.userId) {
			userId = $places.userId;
		} else if (window.localStorage.getItem('userId')) {
			userId = window.localStorage.getItem('userId');
		} else {
			userId = crypto.randomUUID();
			window.localStorage.setItem('userId', userId);
		}

		// listen for realtime
		// insert events
		supabase
			.channel('any')
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'locations_matched'
				},
				(payload) => {
					// add property
					payload.new['matched'] = true;

					userItems.push(payload.new);
					showMatch(payload.new);
				}
			)
			.subscribe();

		// animate initial img
		gsap.to(locationImg, {
			duration: .5,
			scale: 1,
			opacity: 1,
			ease: "expo.out"
		});

	});

	async function animateLocation() {
		await tick();

		let locationImg = document.querySelector('.b-location__stack img');

		// animate imgs
		gsap.set(locationImg, {opacity: 0});
		gsap.to(locationImg, {
			duration: .5,
			delay: .5,
			scale: 1,
			opacity: 1,
			ease: "expo.out"
		});
	}

	function showMatch(data) {
		match = data;
	}

	async function yes(e) {
		const { id, name, zip } = e.currentTarget.dataset;
		const slug = $places?.form?.results?.slug
			? $places.form.results.slug
			: data.results.data[0].slug;


			// if ID exists, return w/ success if so
		const success = await supabase
			.from('locations_approved')
			.select()
			.neq('user_id', userId)
			.eq('location_id', id);

		if (success.data.length) {
			// Success! send location
			// to realtime table
			match = await supabase.from('locations_matched').insert({
				location_id: id,
				location: businesses[0],
				name: name,
				slug,
				zip
			});

			showMatch(success.data[0]);
		} else {
			// add yes item
			userItems.push(businesses[0]);
		}

		// insert row
		const { error } = await supabase.from('locations_approved').insert({
			location_id: id,
			location: businesses[0],
			name: name,
			user_id: userId,
			slug,
			zip
		});

		if (error) {
			console.log('Insert Error: ', error);
		}

		// remove from array
		businesses = businesses.slice(1);
		animateLocation();
	}

	function no() {
		// remove from array
		businesses = businesses.slice(1);
		animateLocation();
	}
</script>

<Header />

<main>
	{#if showMap}
		<svelte:component this={EsriMap} {showMap} {userItems} />
		<button
			on:click={() => showMap = false}
			transition:fly={{y: 24}}
			id="map-close"
			aria-controls="map"
			aria-label="show website"
			class="b-location__map-close"
		><svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg></button>
	{/if}

	<section class="b-location" transition:fade={{duration: 1000, delay: 500, easing: backInOut}}>
		<div class="container">
			{#if match}
				<div class="b-location__match">
					<p class="b-location__match-text">
						<span><strong>Wahoo!</strong></span> You matched on
					</p>
					<p class="b-location__match-text">
						"<strong>{match.name}</strong>" 🎉
					</p>
					<img class="b-location__img b-location__img--match" src="{match.location.image_url}" alt="{match.name}" width="400" height="400">
					<div class="b-location__match-btn-wrap">
						<button
							on:click={() => {showMap = true}}
							aria-label="show map"
							aria-controls="map"
							class="b-button b-button--secondary"
						><svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 0C7.77614 0 8 0.223858 8 0.5V1.80687C10.6922 2.0935 12.8167 4.28012 13.0068 7H14.5C14.7761 7 15 7.22386 15 7.5C15 7.77614 14.7761 8 14.5 8H12.9888C12.7094 10.6244 10.6244 12.7094 8 12.9888V14.5C8 14.7761 7.77614 15 7.5 15C7.22386 15 7 14.7761 7 14.5V13.0068C4.28012 12.8167 2.0935 10.6922 1.80687 8H0.5C0.223858 8 0 7.77614 0 7.5C0 7.22386 0.223858 7 0.5 7H1.78886C1.98376 4.21166 4.21166 1.98376 7 1.78886V0.5C7 0.223858 7.22386 0 7.5 0ZM8 12.0322V9.5C8 9.22386 7.77614 9 7.5 9C7.22386 9 7 9.22386 7 9.5V12.054C4.80517 11.8689 3.04222 10.1668 2.76344 8H5.5C5.77614 8 6 7.77614 6 7.5C6 7.22386 5.77614 7 5.5 7H2.7417C2.93252 4.73662 4.73662 2.93252 7 2.7417V5.5C7 5.77614 7.22386 6 7.5 6C7.77614 6 8 5.77614 8 5.5V2.76344C10.1668 3.04222 11.8689 4.80517 12.054 7H9.5C9.22386 7 9 7.22386 9 7.5C9 7.77614 9.22386 8 9.5 8H12.0322C11.7621 10.0991 10.0991 11.7621 8 12.0322Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg></button>
						<a
							href="{match.location.url}"
							target="_blank"
							class="b-button"
							rel="nofollow noopener"
							aria-label="{match.name} - Opens in new window"
						><svg width="24" height="24" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.49996 1.80002C4.35194 1.80002 1.79996 4.352 1.79996 7.50002C1.79996 10.648 4.35194 13.2 7.49996 13.2C10.648 13.2 13.2 10.648 13.2 7.50002C13.2 4.352 10.648 1.80002 7.49996 1.80002ZM0.899963 7.50002C0.899963 3.85494 3.85488 0.900024 7.49996 0.900024C11.145 0.900024 14.1 3.85494 14.1 7.50002C14.1 11.1451 11.145 14.1 7.49996 14.1C3.85488 14.1 0.899963 11.1451 0.899963 7.50002Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path><path d="M13.4999 7.89998H1.49994V7.09998H13.4999V7.89998Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path><path d="M7.09991 13.5V1.5H7.89991V13.5H7.09991zM10.375 7.49998C10.375 5.32724 9.59364 3.17778 8.06183 1.75656L8.53793 1.24341C10.2396 2.82218 11.075 5.17273 11.075 7.49998 11.075 9.82724 10.2396 12.1778 8.53793 13.7566L8.06183 13.2434C9.59364 11.8222 10.375 9.67273 10.375 7.49998zM3.99969 7.5C3.99969 5.17611 4.80786 2.82678 6.45768 1.24719L6.94177 1.75281C5.4582 3.17323 4.69969 5.32389 4.69969 7.5 4.6997 9.67611 5.45822 11.8268 6.94179 13.2472L6.45769 13.7528C4.80788 12.1732 3.9997 9.8239 3.99969 7.5z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path><path d="M7.49996 3.95801C9.66928 3.95801 11.8753 4.35915 13.3706 5.19448 13.5394 5.28875 13.5998 5.50197 13.5055 5.67073 13.4113 5.83948 13.198 5.89987 13.0293 5.8056 11.6794 5.05155 9.60799 4.65801 7.49996 4.65801 5.39192 4.65801 3.32052 5.05155 1.97064 5.8056 1.80188 5.89987 1.58866 5.83948 1.49439 5.67073 1.40013 5.50197 1.46051 5.28875 1.62927 5.19448 3.12466 4.35915 5.33063 3.95801 7.49996 3.95801zM7.49996 10.85C9.66928 10.85 11.8753 10.4488 13.3706 9.6135 13.5394 9.51924 13.5998 9.30601 13.5055 9.13726 13.4113 8.9685 13.198 8.90812 13.0293 9.00238 11.6794 9.75643 9.60799 10.15 7.49996 10.15 5.39192 10.15 3.32052 9.75643 1.97064 9.00239 1.80188 8.90812 1.58866 8.9685 1.49439 9.13726 1.40013 9.30601 1.46051 9.51924 1.62927 9.6135 3.12466 10.4488 5.33063 10.85 7.49996 10.85z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg></a>
					</div>
				</div>
			{:else if businesses}
				<div class="b-location__stack">
					<!-- <svg class="b-location__loading" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,176A72,72,0,0,1,92,65.64a8,8,0,0,1,8,13.85,56,56,0,1,0,56,0,8,8,0,0,1,8-13.85A72,72,0,0,1,128,200Z"/></svg> -->
					{#each businesses as b, index (index)}
						{#if index === 0}
							{#key b.id}
								<div data-key={b.id} class="b-location__wrap">
									{#if b.image_url}
										<img in:fade src={b.image_url} alt="{b.name}" width="400" height="400" class="b-location__img">
									{:else}
										<div class="b-location__img b-location__img--not-found">
											<p>Image not found</p>
										</div>
									{/if}
									<div class="b-location__content">
										<h3 class="b-location__title" in:fade>{b.name}</h3>

										<div in:fade class="b-location__rating">
											{#each Array(Math.ceil(b.rating)) as _}
												<svg class="b-location__rating-svg" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.22303 0.665992C7.32551 0.419604 7.67454 0.419604 7.77702 0.665992L9.41343 4.60039C9.45663 4.70426 9.55432 4.77523 9.66645 4.78422L13.914 5.12475C14.18 5.14607 14.2878 5.47802 14.0852 5.65162L10.849 8.42374C10.7636 8.49692 10.7263 8.61176 10.7524 8.72118L11.7411 12.866C11.803 13.1256 11.5206 13.3308 11.2929 13.1917L7.6564 10.9705C7.5604 10.9119 7.43965 10.9119 7.34365 10.9705L3.70718 13.1917C3.47945 13.3308 3.19708 13.1256 3.25899 12.866L4.24769 8.72118C4.2738 8.61176 4.23648 8.49692 4.15105 8.42374L0.914889 5.65162C0.712228 5.47802 0.820086 5.14607 1.08608 5.12475L5.3336 4.78422C5.44573 4.77523 5.54342 4.70426 5.58662 4.60039L7.22303 0.665992Z" fill="currentColor"></path></svg>
											{/each}
										</div>

										<div in:fade class="b-location__cat">
											{#each b.categories as cat}
												<span>{cat.title}</span>
											{/each}
										</div>

										<div class="b-location__btn-wrap">
											<button
												bind:this={yLocation}
												on:click={yes}
												data-name={b.name}
												data-id={b.id}
												data-zip={b.location.zip_code}
												aria-label="Yes"
											><svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg></button>
											<button
												bind:this={nLocation}
												on:click={no}
												data-name={b.name}
												data-id={b.id}
												data-zip={b.location.zip_code}
												aria-label="No"
											><svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg></button
											>
										</div>
									</div>
								</div>
							{/key}
						{/if}
					{/each}
				</div>
				{#if !businesses.length}
					<h1 class="b-location__no-results-title" transition:fade={{duration: 500, delay: 750, easing: backInOut}}>
						Welp, no matches yet. <button
							on:click={() => {
								window.location.reload();
							}}
							class="b-button b-button--secondary"
						>Try again</button
						>
						{#if userItems.length}
							or convince someone of the places you said
							<button on:click={() => {showMap = true}} class="b-button b-button--secondary">Yes</button> to.
						{/if}
					</h1>
					{#if userItems && showUserItems}
						{#each userItems as item}
							<p>
								name: <a target="_blank" rel="nofollow noreferrer noopener" href={item.url}>{item.name}</a
								><br>rating: {item.rating}
							</p>
							<img src={item.image_url} width="300" height="366" alt="" />
							<hr />
						{/each}
					{/if}
				{/if}
			{/if}
		</div>
	</section>
</main>

<style lang="postcss">
	.b-location__stack {
		position: relative;
	}

	.b-location__loading {
		position: absolute;
		width: 50px;
		animation: var(--animation-spin);
		display: none;
	}

	.b-location__wrap {
		display: grid;
		grid-template-columns: 1fr 200px;
		align-items: center;
		gap: var(--size-fluid-6);
	}

	.b-location__img {
		position: relative;
		width: clamp(475px, 44vw, 600px);
		height: clamp(475px, 44vw, 600px);
		border-radius: var(--radius-conditional-3);
		object-fit: cover;
		border: 8px solid var(--color-dark);
		transform: scale(.85);
		opacity: 0;

		&.b-location__img--match {
			opacity: 1;
		}

		&.b-location__img--not-found {
			opacity: 1;
			background: var(--color-dark);
			display: flex;
			justify-content: center;
			align-items: center;
		}
	}

	.b-location__content {
		display: flex;
		flex-direction: column;
		justify-content: center;
		white-space: nowrap;
		gap: 1rem;
	}

	.b-location__rating {
		display: flex;
		gap: .5rem;
	}

	.b-location__rating-svg path {
		fill: var(--text-1);
	}

	.b-location__cat {
		display: flex;
		margin-block-start: .5rem;
		gap: .5rem;

		& span {
			display: inline-block;
			font-size: var(--step--2);
			letter-spacing: .1em;
			border: 1px solid var(--text-1);
			border-radius: 43222232px;
			padding-inline: .78em;
		}
	}

	.b-location__btn-wrap {
		display: flex;
		margin-inline-start: -.2rem;
		margin-block-start: 1.85rem;
		gap: 1.25rem;
	}

	.b-location__match-btn-wrap {
		display: flex;
		justify-content: center;
		gap: 1.25rem;
	}

	.b-location__match-text {
		text-align: center;
		margin: 0 auto;

		& span {
			color: var(--color-primary);
		}
	}

	.b-location__map-close {
		position: fixed;
		background: var(--gray-9);
		bottom: 2em;
		right: 1.5em;
		z-index: 9;
	}

	.b-location__no-results-title {
		font-size: var(--step-3);
	}

	@media screen and (max-width: 1440px) {
		.b-location__wrap {
			display: grid;
			grid-template-columns: 1fr;
			grid-template-row: 1fr;
		}

		.b-location__content {
			align-items: center;
		}

		.b-location__title {
			display: flex;
			justify-content: center;
		}

		.b-location__rating {
			justify-content: center
		}

		.b-location__cat {
			justify-content: center;
		}

		.b-location__btn-wrap {
			justify-content: center;
			margin-inline-start: 0;

			& button {
				align-self: center;
			}
		}
	}

	@media screen and (max-width: 768px) {
		.b-location__img {
			width: clamp(325px, 44vw, 600px);
			height: clamp(325px, 44vw, 600px);
		}

		.b-location__match-text {
			max-width: 24ch;
		}
	}

	@media screen and (max-width: 550px) {
		.b-location__map-close {
			bottom: 3em;
			right: 1.5em;
		}
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>

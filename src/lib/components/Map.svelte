<script>
	import ArcGISMap from '@arcgis/core/Map';
	import MapView from '@arcgis/core/views/MapView';
	import Graphic from '@arcgis/core/Graphic';

	import '@arcgis/core/assets/esri/themes/dark/main.css';

	import { onMount } from 'svelte';
	import { backInOut } from 'svelte/easing';
	import { slide, fade } from 'svelte/transition';

	export let showMap;
	export let userItems;
	let isMatched = false;
	let markers = [];

	onMount(() => {
		const map = new ArcGISMap({
			basemap: 'dark-gray-vector'
		});

		const view = new MapView({
			map,
			container: 'viewDiv',
			zoom: 10
		});

		// build array of markers
		[...userItems].forEach(item => {

			if (item.matched) {
				isMatched = true;
			}

			markers.push({
				location: {
					x: item.coordinates.longitude,
					y: item.coordinates.latitude,
					type: 'point',
				},
				content: {
					name: item.name,
					alias: item.alias,
					open: true,
					phone: item.display_phone,
					link: item.url,
					img: item.image_url
				},
				matched: item.matched ? true : false
			});
		});

		// set center coords
		// if no POI match
		let centerCoords = [markers[0].location.x, markers[0].location.y];

		// add marker graphics to map view
		markers.forEach(function (marker) {
			view.graphics.add(
				new Graphic({
					attributes: marker.attributes,
					geometry: marker.location,
					symbol: {
						type: 'simple-marker',
						color: '#000000',
						size: '24px',
						outline: {
							color: marker.matched ? '#e872b7' : '#fffffff',
							width: '12px'
						}
					},
					popupTemplate: {
						title: marker.content.name,
						content: `
							<div>
								<div>
									<img style="
											margin-top: 16px;
											margin-bottom: 16px;
											width: 100px;
											height: 100px;
											border: 4px solid #fff;
											border-radius: 50%;"
										alt="${marker.content.name}"
										src="${marker.content.img}"
									>
								</div>
								<div style="margin-bottom: 8px;"><strong>Open: </strong>${marker.content.open ? 'Yes' : 'No'}</div>
								<div style="margin-bottom: 8px;"><strong>Phone: </strong><a href=tel:"${marker.content.phone ?? marker.content.phone}">${marker.content.phone}</a></div>
								<div><strong>Link: </strong><a href="${marker.content.link ?? marker.content.link}" target="_blank">yelp.com/${marker.content.alias ?? marker.content.alias}</a></div>
							</div>
						`
					}
				})
			);

			// update center coords
			// with POI match
			if (marker.matched) {
				centerCoords = [];
				centerCoords.push(marker.location.x, marker.location.y);
			}
		});

		// update map view
		view.when(function () {
			view.goTo({
				center: [centerCoords[0], centerCoords[1]],
				zoom: isMatched ? 12 : 10
			})
		})
		.catch(function (err) {
			console.error('Map view rejected: ', err);
		});
	});
</script>

{#if showMap}
	<section transition:slide={{ duration: 1000, easing: backInOut, axis: 'x' }} class="b-map" id="map" aria-labelledby="map-close">
		<div transition:fade={{ delay: 100 }}  id="viewDiv" class="b-map__canvas" />
	</section>
{/if}

<style langscss="postcss">
	.b-map {
		width: 100vw;
		height: 100vh;
		position: fixed;
		top: 0;
		left: 0;
		z-index: 8;

		&::before {
			content: '';
			position: absolute;
			background: var(--gray-8);
			width: 100vw;
			height: 100vh;
			top: 0;
			left: 0;
		}
	}

	.b-map__canvas {
		position: relative;
		width: 100vw;
		height: 100vh;
		object-fit: cover;
	}

	@media screen and (max-width: 768px) {
		.b-map__canvas,
		.b-map {
			height: 100%;
		}
	}
</style>


import { PRIVATE_YELP_KEY } from '$env/static/private';
import { supabase } from '$lib/supabaseClient';
import { fail } from '@sveltejs/kit';
import axios  from 'axios';

let slug; // url param
let radius = 16093; // 10 miles
let randomOffset = 0; // randomize offset
let randomImg; // used to show random image on play page
let limit = process.env.NODE_ENV === 'development' ? 3 : 5; // max yelp results

export async function load() {
	randomImg = Math.floor(Math.random() * 3);

	return {
		randomImg
	}
}

// Get the total number of places
// so an offset # can be used
async function getOffset(cat=null, zip=null) {
	// consider appending param: &open_now=true
	const offset = `https://api.yelp.com/v3/businesses/search?limit=1&radius=${radius}&location=${zip}&term=${cat}&open_now=true`
	const headers = {
		'Authorization': `Bearer ${PRIVATE_YELP_KEY}`,
		'Accept': 'application/json',
		'Content-Type': 'application/x-www-form-urlencoded',
		"Access-Control-Allow-Origin": "*", // Required for CORS support to work
		"Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS
	}

	const offsetNumber = await axios.get(offset, {headers}).then((total) => {
		return fetchLocations(cat, zip, total.data.total)
	});


	return offsetNumber;
}

// Use Yelp's API to
// find locations
async function fetchLocations(cat=null, zip=null,total=null) {
	// make sure offset is
	// not > than total
	if ( total ) {
		randomOffset = Math.floor(Math.random() * parseInt((total - limit), 10));

		// yelp's max value for
		// the offset is 1000
		if ( total >= 1000 ) {
			randomOffset = Math.floor(Math.random() * (1000 - limit), 10);
		}
	}

	// consider appending param: &open_now=true
	const route = `https://api.yelp.com/v3/businesses/search?limit=${limit}&offset=${randomOffset}&radius=${radius}&location=${zip}&term=${cat}&open_now=true`
	const headers = {
		'Authorization': `Bearer ${PRIVATE_YELP_KEY}`,
		'Accept': 'application/json',
		'Content-Type': 'application/x-www-form-urlencoded',
		"Access-Control-Allow-Origin": "*", // Required for CORS support to work
		"Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS
	}

	const data = await axios.get(route, {headers}).then(places => {
		 return storePlace(places);
	});

	return data;
}

async function storePlace(yelp_results) {
	// user_id = crypto.randomUUID();
	slug = crypto.randomUUID();
	const save = await supabase
		.from('locations_by_id')
		.insert({
			slug,
			locations: yelp_results.data.businesses
		})
		.then(sb_results => {
			return {
				success: true,
				slug,
				...sb_results,
				...yelp_results.data
			};
	});

	return save;
}

// USE `export let form` in view
/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ request }) => {

		try {
			const data = await request.formData();
			const cat = data.get('cat');
			const zip = data.get('zip');

			// return form
			// if invalid
			if (!cat || !zip) {
				return fail(400, {
					error: true,
					message: 'Please fill out all fields.',
					cat,
					zip,
				});
			}

			return {
				cat,
				zip,
				results: await getOffset(cat, zip)
			}

		} catch (error) {
			console.log('Error: ', error);
		}
  }

};

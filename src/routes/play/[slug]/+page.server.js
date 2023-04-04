import { PRIVATE_YELP_KEY } from '$env/static/private';
import { supabase } from '$lib/supabaseClient';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({params}) {
	// if ID exists
	const results  = await supabase
		.from('locations_by_id')
		.select()
		.eq('slug', params.slug);

	return {
		results,
		slug: params.slug
	}

	throw error(404, 'Not Found');
}
<footer>
	<p>&copy {new Date().getFullYear()} idk. All rights reserved. <a href="mailto:halves-dorados-0m@icloud.com?subject=IDK%20Question" target="_blank">Questions?</a></p>
</footer>

<style>
	footer {
		position: fixed;
		bottom: 0;
		left: 0;
		padding: var(--size-1) 2em;
		width: 100vw;
		background: var(--surface-2);
		color: var(--text-1);
	}

	p {
		font-size: var(--step--1);
	}

	@media screen and (max-width: 550px) {
		footer {
			display: none;
		}
	}
</style>
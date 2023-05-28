import * as esbuild from 'esbuild';

esbuild.build({
	entryPoints: ["js/main.js"],
	bundle: true,
	minify: true,
	target: "es2020",
	outfile: "dist/js/index.js"
})
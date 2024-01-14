import { readFileSync, writeFileSync } from 'fs';
import axios from 'axios';

const repertoire = JSON.parse(readFileSync('../hanzi-chai.github.io/public/cache/repertoire.json'));
const token =
	'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI5NTYxMDkxODYiLCJpYXQiOjE3MDUyMDU3ODMsImV4cCI6MTcwNTgxMDU4MywidWlkIjoidGFuc29uZ2NoZW4ifQ.VHhziPbwN7zMAAF1rfuJ_FeA2e50s3LdKyiWOhaWKEI';

function processStroke(stroke) {
	if (typeof stroke === "number") {
		return { feature: "reference", index: stroke }
	}
	return stroke;
}

function processGlyph(glyph) {
	if (glyph.type === "compound") return glyph;
	if (glyph.source === undefined) {
		delete glyph.source;
		glyph.type = "basic_component";
		return glyph;
	}
	glyph.type = "derived_component";
	console.assert(glyph.source !== undefined);
	glyph.strokes = glyph.strokes.map(processStroke)
	return glyph
}

const results = repertoire.map(x  => {
	const processed = { ...x, glyphs: x.glyphs.map(processGlyph) }
	return processed;
});

writeFileSync("output.json", JSON.stringify(results.slice(0, 100)));

const res = await axios.post(`https://api.chaifen.app/repertoire/batch`, results, { headers: { Authorization: `Bearer ${token}` } });

console.log(res);

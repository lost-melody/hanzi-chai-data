// 实际存放在数据库的类型是这个

interface GlyphModel {
	unicode: number;
	name: string | null;
	default_type: 0 | 1 | 2;
	gf0014_id: number | null;
	component: string | null;
	compound: string | null;
	slice: string | null;
}

// 要返回给客户端的类型是这个，其中存储了 JSON 的字段被 parse 了
// 未定义的字形表示方法用 undefined 来表示

type Glyph = Omit<GlyphModel, 'component' | 'compound' | 'slice'> & {
	component?: object;
	compound?: { operator: string; operandList: string[] };
	slice?: { source: string; indices: number[] };
};

interface NamedGlyph extends Omit<Glyph, 'unicode'> {
	name: string;
}

export type Thread = { id: string; name: string; hex: string };
// DMC numbers identify actual Mouliné Spécial threads. RGB values are approximate display swatches.
// Whites, black and greys lead; everything else follows in DMC number order.
export const threads: Thread[] = [
  ['Blanc', '白', 'f5f4ed'],
  ['3865', 'ウィンターホワイト', 'f5f1e7'],
  ['Ecru', '生成り', 'e8dfc3'],
  ['310', '黒', '252528'],
  ['762', 'パールグレー（極淡）', 'ececec'],
  ['415', 'パールグレー', 'd3d3d6'],
  ['318', 'ライトグレー', 'a5a5a5'],
  ['414', 'ダークグレー', '666971'],
  ['317', 'ピューターグレー', '6c6c6c'],
  ['413', 'ピューターグレー（濃）', '565656'],
  ['3799', 'チャコール', '424242'],
  ['150', 'ダスティローズ（極濃）', 'ab0249'],
  ['151', 'ダスティローズ（極淡）', 'f0ced4'],
  ['153', 'ライトバイオレット', 'dfc5e4'],
  ['154', 'グレープ（極濃）', '572433'],
  ['155', 'ブルーバイオレット', '9891b6'],
  ['157', 'コーンフラワー（極淡）', 'bbc3d9'],
  ['160', 'ブルーグレー', '999fb7'],
  ['162', 'アイスブルー', 'dbecf5'],
  ['163', 'セラドングリーン', '4d8361'],
  ['164', 'フォレストグリーン（淡）', 'c8d8b8'],
  ['165', 'モスグリーン（極淡）', 'eff4a4'],
  ['166', 'モスグリーン', 'c0c840'],
  ['208', 'ラベンダー（極濃）', '835b8b'],
  ['209', 'ラベンダー（濃）', 'a37ba7'],
  ['210', 'ラベンダー', 'c39fc3'],
  ['211', 'ラベンダー（淡）', 'e3cbe3'],
  ['221', 'シェルピンク（極濃）', '883e43'],
  ['223', 'シェルピンク', 'cc847c'],
  ['224', 'シェルピンク（淡）', 'ebb7af'],
  ['225', 'シェルピンク（極淡）', 'ffdfd5'],
  ['300', 'マホガニー（極濃）', '6f2f00'],
  ['301', 'マホガニー', 'b35f2b'],
  ['304', 'ミディアムレッド', 'b71f33'],
  ['307', 'レモンイエロー', 'fded54'],
  ['311', 'ミディアムブルー', '1c5066'],
  ['312', 'ベビーブルー（極濃）', '35668b'],
  ['315', 'アンティークモーブ（濃）', '814952'],
  ['316', 'アンティークモーブ', 'b7737f'],
  ['319', 'ピスタチオ（極濃）', '205f2e'],
  ['320', 'ピスタチオ', '69885a'],
  ['321', '赤', 'bb2439'],
  ['322', 'ベビーブルー（濃）', '5a8fb8'],
  ['326', 'ローズ（極濃）', 'b33b4b'],
  ['327', 'バイオレット（濃）', '633666'],
  ['333', 'ブルーバイオレット（極濃）', '5c5478'],
  ['334', 'ベビーブルー（中）', '739fc1'],
  ['335', 'ローズ', 'ee546e'],
  ['336', 'ネイビーブルー', '253b73'],
  ['340', 'ブルーバイオレット（中）', 'ada7c7'],
  ['341', 'ブルーバイオレット（淡）', 'b7bfdd'],
  ['347', 'サーモン（極濃）', 'bf2d2d'],
  ['349', 'コーラル（濃）', 'd21035'],
  ['350', 'コーラル（中）', 'e04848'],
  ['351', 'コーラル', 'e96a67'],
  ['352', 'コーラル（淡）', 'fd9c97'],
  ['353', 'ピーチ', 'fed7cc'],
  ['355', 'テラコッタ（濃）', '984436'],
  ['356', 'テラコッタ', 'c56a5b'],
  ['367', 'ピスタチオ（濃）', '617a52'],
  ['368', 'ピスタチオ（淡）', 'a6c298'],
  ['369', 'ピスタチオ（極淡）', 'd7edcc'],
  ['400', 'マホガニー（濃）', '8f430f'],
  ['402', 'マホガニー（極淡）', 'f7a777'],
  ['407', 'デザートサンド', 'bb8161'],
  ['420', 'ヘーゼルナッツ（濃）', 'a07042'],
  ['422', 'ヘーゼルナッツ（淡）', 'c69f7b'],
  ['433', 'ブラウン', '835a3b'],
  ['434', 'ブラウン（淡）', '985e33'],
  ['435', 'ライトブラウン', 'ba8959'],
  ['436', 'タン', 'cb9051'],
  ['437', 'タン（淡）', 'e4bb8e'],
  ['444', 'レモン', 'f1cd25'],
  ['451', 'シェルグレー（濃）', '917b73'],
  ['452', 'シェルグレー', 'c0b3ae'],
  ['453', 'シェルグレー（淡）', 'd7cecb'],
  ['469', 'オリーブ', '728144'],
  ['470', 'ライトオリーブ', '95a64d'],
  ['498', 'レッド（濃）', 'a7132b'],
  ['500', 'ブルーグリーン（極濃）', '044d33'],
  ['501', 'ブルーグリーン（濃）', '396f52'],
  ['502', 'ブルーグリーン（中）', '5b9071'],
  ['503', 'ブルーグリーン（淡）', '7bac94'],
  ['504', 'ブルーグリーン（極淡）', 'c4decc'],
  ['517', 'ウェッジウッド（濃）', '3b768f'],
  ['518', 'ウェッジウッド', '4f93a7'],
  ['519', 'スカイブルー', '7eb1c8'],
  ['535', 'アッシュグレー', '636458'],
  ['543', 'ベージュブラウン（極淡）', 'f2e3ce'],
  ['550', 'バイオレット', '64396f'],
  ['552', 'パープル', '9460a0'],
  ['553', 'バイオレット（中）', 'a3638b'],
  ['554', 'バイオレット（淡）', 'dbb3cb'],
  ['561', 'ジェード（極濃）', '2c6a45'],
  ['562', 'ジェード', '53976a'],
  ['563', 'ジェード（淡）', '8fc098'],
  ['564', 'ジェード（極淡）', 'a7cdaf'],
  ['597', 'ライトターコイズ', '78b8c4'],
  ['598', 'ターコイズ（淡）', '90c3cc'],
  ['600', 'クランベリー（極濃）', 'cd2f63'],
  ['601', 'クランベリー（濃）', 'd1286a'],
  ['602', 'クランベリー', 'e24874'],
  ['603', 'クランベリー（中）', 'ffa4be'],
  ['604', 'クランベリー（淡）', 'ffb0be'],
  ['605', 'クランベリー（極淡）', 'ffc0cd'],
  ['606', 'オレンジレッド', 'fa3203'],
  ['608', 'ブライトオレンジ', 'fd5d35'],
  ['610', 'ドラブブラウン（濃）', '796047'],
  ['612', 'ドラブブラウン', 'bc9a78'],
  ['613', 'ドラブブラウン（淡）', 'dcc4aa'],
  ['632', 'デザートサンド（極濃）', '875539'],
  ['640', 'ベージュグレー（極濃）', '857b61'],
  ['642', 'ベージュグレー（濃）', 'a49878'],
  ['644', 'ベージュグレー', 'ddd8cb'],
  ['645', 'ビーバーグレー（極濃）', '6e655c'],
  ['646', 'ビーバーグレー（濃）', '877d73'],
  ['647', 'ビーバーグレー', 'b0a69c'],
  ['648', 'ビーバーグレー（淡）', 'bcb4ac'],
  ['666', 'ブライトレッド', 'e33139'],
  ['676', 'オールドゴールド（淡）', 'e5ce97'],
  ['677', 'オールドゴールド（極淡）', 'f5eccb'],
  ['680', 'オールドゴールド（濃）', 'bc8d0e'],
  ['699', '深緑', '17663c'],
  ['700', 'ブライトグリーン', '07731b'],
  ['701', 'グリーン（淡）', '3f8f29'],
  ['702', 'ケリーグリーン', '399447'],
  ['703', 'シャルトルーズ', '7bb547'],
  ['704', 'シャルトルーズ（明）', '9ecf34'],
  ['712', 'クリーム', 'fffbef'],
  ['718', 'プラム', '9c2462'],
  ['720', 'オレンジスパイス（濃）', 'e55c1f'],
  ['721', 'オレンジスパイス', 'f27842'],
  ['722', 'オレンジスパイス（淡）', 'f7976f'],
  ['725', 'トパーズ', 'ffc840'],
  ['726', 'トパーズ（淡）', 'fdd755'],
  ['727', 'トパーズ（極淡）', 'fff1af'],
  ['729', 'オールドゴールド', 'd0a53e'],
  ['738', 'タン（極淡）', 'eccc9e'],
  ['739', 'タン（ごく淡）', 'f8e4c8'],
  ['740', 'オレンジ', 'f78026'],
  ['741', 'タンジェリン', 'ffa32b'],
  ['742', 'タンジェリン（淡）', 'ffbf57'],
  ['743', 'イエロー', 'f8d77a'],
  ['744', 'ペールイエロー', 'ffe793'],
  ['745', 'ペールイエロー（淡）', 'ffe9ad'],
  ['746', 'オフホワイト', 'fcfcee'],
  ['754', 'ピーチ（淡）', 'f7cbbf'],
  ['758', 'テラコッタ（極淡）', 'eeaa9b'],
  ['760', 'サーモン', 'f5adad'],
  ['761', 'ライトサーモン', 'f5b6b7'],
  ['772', 'イエローグリーン（極淡）', 'e4ecd4'],
  ['775', 'ベビーブルー（極淡）', 'd9ebf1'],
  ['776', 'ピンク（中）', 'fcb0b9'],
  ['778', 'アンティークモーブ（極淡）', 'dfb3bb'],
  ['780', 'トパーズ（極濃）', '94631a'],
  ['782', 'トパーズ（濃）', 'ae7720'],
  ['783', 'トパーズ（中）', 'ce9124'],
  ['791', 'コーンフラワー（極濃）', '464563'],
  ['792', 'コーンフラワー（濃）', '555b7b'],
  ['793', 'コーンフラワー', '707da2'],
  ['794', 'コーンフラワー（淡）', '8f9cc1'],
  ['796', 'ロイヤルブルー（濃）', '11416d'],
  ['797', 'ロイヤルブルー', '354e91'],
  ['798', 'ブルー', '5276aa'],
  ['800', 'デルフトブルー（極淡）', 'c0ccde'],
  ['801', 'ダークブラウン', '69412f'],
  ['809', 'デルフトブルー', '94a8c6'],
  ['813', 'ブルー（淡）', 'a1c2d7'],
  ['814', 'ワイン', '722438'],
  ['815', 'ガーネット（中）', '87071f'],
  ['816', 'ガーネット', '970b23'],
  ['817', 'コーラルレッド', 'bb051f'],
  ['818', 'ベビーピンク', 'ffdfd9'],
  ['819', 'ベビーピンク（淡）', 'ffeeeb'],
  ['820', 'ネイビー', '263460'],
  ['822', 'ベージュグレー（淡）', 'e7e2d3'],
  ['823', 'ネイビー（濃）', '213063'],
  ['824', 'ブルー（極濃）', '396987'],
  ['825', 'ブルー（濃）', '4781a5'],
  ['826', 'ブルー（中）', '6b9ebf'],
  ['827', 'ブルー（極淡）', 'bddded'],
  ['828', 'ブルー（ごく淡）', 'c5e8ed'],
  ['838', 'ベージュブラウン（極濃）', '594937'],
  ['839', 'ベージュブラウン（濃）', '675541'],
  ['840', 'ベージュブラウン', '9a7c5c'],
  ['841', 'ベージュブラウン（淡）', 'b69b7e'],
  ['842', 'ベージュブラウン（ごく淡）', 'd1baa1'],
  ['844', 'ビーバーグレー（ごく濃）', '484848'],
  ['890', 'ピスタチオ（ごく濃）', '174923'],
  ['891', 'カーネーション（濃）', 'ff5773'],
  ['893', 'カーネーション（淡）', 'fc90a2'],
  ['894', 'カーネーション（極淡）', 'ffb2bb'],
  ['895', 'ハンターグリーン（極濃）', '1b5300'],
  ['898', 'コーヒーブラウン', '492a13'],
  ['899', 'ローズ（中）', 'f27688'],
  ['900', 'バーントオレンジ（濃）', 'd15807'],
  ['904', 'パロットグリーン（極濃）', '557822'],
  ['905', 'パロットグリーン（濃）', '628a28'],
  ['906', 'パロットグリーン', '7fb335'],
  ['907', 'パロットグリーン（淡）', 'c7e666'],
  ['909', 'エメラルド（極濃）', '156f49'],
  ['910', 'エメラルド（濃）', '187e56'],
  ['911', 'エメラルド', '189065'],
  ['912', 'エメラルド（淡）', '1b9d6b'],
  ['913', 'ナイルグリーン（中）', '6dab77'],
  ['915', 'プラム（濃）', '820043'],
  ['917', 'プラム（中）', '9b1359'],
  ['918', 'レッドコッパー（濃）', '82340a'],
  ['919', 'レッドコッパー', 'a64510'],
  ['920', 'コッパー（中）', 'ac5414'],
  ['921', 'コッパー', 'c66218'],
  ['922', 'コッパー（淡）', 'e27323'],
  ['924', 'グレーグリーン（極濃）', '566a6a'],
  ['926', 'グレーグリーン', '98aeae'],
  ['927', 'グレーグリーン（淡）', 'bdcbcb'],
  ['928', 'グレーグリーン（極淡）', 'dde3e3'],
  ['930', 'アンティークブルー（濃）', '455c71'],
  ['931', 'アンティークブルー', '6a859e'],
  ['932', 'アンティークブルー（淡）', 'a2b5c6'],
  ['934', 'ブラックアボカド', '313919'],
  ['936', 'アボカド（極濃）', '4c5826'],
  ['937', 'アボカド', '627133'],
  ['938', 'コーヒーブラウン（極濃）', '361f0e'],
  ['939', 'ネイビー（極濃）', '1b2853'],
  ['943', 'ブライトグリーン（中）', '3d9384'],
  ['945', 'トーニー', 'fbd5bb'],
  ['946', 'バーントオレンジ', 'eb6307'],
  ['947', 'バーントオレンジ（淡）', 'ff7b4d'],
  ['948', 'ピーチ（極淡）', 'fee7da'],
  ['950', 'デザートサンド（淡）', 'eed3c4'],
  ['951', 'トーニー（淡）', 'ffe2cf'],
  ['954', 'ナイルグリーン', '88ba91'],
  ['955', 'ナイルグリーン（淡）', 'a2d6ad'],
  ['957', 'ゼラニウム（淡）', 'fdb5b5'],
  ['958', 'シーグリーン（濃）', '3eb6a1'],
  ['959', 'シーグリーン', '59c7b4'],
  ['961', 'ダスティローズ（濃）', 'cf7373'],
  ['962', 'ダスティローズ', 'e68a8a'],
  ['963', 'ダスティローズ（ごく淡）', 'ffd7d7'],
  ['964', 'シーグリーン（淡）', 'a9e2d8'],
  ['966', 'ベビーグリーン', 'b9d7c0'],
  ['970', 'パンプキン（淡）', 'f78b13'],
  ['971', 'パンプキン', 'f67f00'],
  ['972', 'カナリア（濃）', 'ffb515'],
  ['973', 'カナリア', 'ffe300'],
  ['975', 'ゴールデンブラウン（濃）', '914f12'],
  ['976', 'ゴールデンブラウン', 'c28142'],
  ['977', 'ゴールデンブラウン（淡）', 'dc9c56'],
  ['986', 'フォレストグリーン（極濃）', '405230'],
  ['987', 'フォレストグリーン（濃）', '587141'],
  ['988', 'フォレストグリーン（中）', '738b5b'],
  ['989', 'フォレストグリーン', '8da675'],
  ['991', 'アクアマリン（濃）', '477b6e'],
  ['992', 'アクアマリン', '6fae9f'],
  ['993', 'アクアマリン（淡）', '90c0b4'],
  ['995', 'エレクトリックブルー（濃）', '2696b6'],
  ['996', 'エレクトリックブルー', '30c2ec'],
  ['3325', 'ベビーブルー（淡）', 'b8d2e6'],
  ['3326', 'ローズ（淡）', 'fbadb4'],
  ['3328', 'サーモン（濃）', 'e36d6d'],
  ['3340', 'アプリコット（中）', 'ff836f'],
  ['3341', 'アプリコット', 'fcab98'],
  ['3345', 'ハンターグリーン（濃）', '1b5915'],
  ['3346', 'ハンターグリーン', '406a3a'],
  ['3347', 'グリーン', '71935c'],
  ['3348', 'イエローグリーン（淡）', 'ccd9b1'],
  ['3371', 'ブラックブラウン', '1e1108'],
  ['3607', 'プラム（淡）', 'c54989'],
  ['3608', 'プラム（極淡）', 'ea9cc4'],
  ['3609', 'プラム（ごく淡）', 'f4aed5'],
  ['3687', 'モーブ', 'c96b70'],
  ['3688', 'モーブ（中）', 'e7a9ac'],
  ['3689', 'モーブ（淡）', 'fbbfc2'],
  ['3705', 'メロン（濃）', 'ff7992'],
  ['3706', 'メロン', 'ffadbc'],
  ['3708', 'メロン（淡）', 'ffcbd5'],
  ['3712', 'サーモン（中）', 'f18787'],
  ['3713', 'サーモン（極淡）', 'ffe2e2'],
  ['3716', 'ピンク', 'f2a0b2'],
  ['3746', 'ブルーバイオレット（濃）', '776b98'],
  ['3747', 'ブルーバイオレット（極淡）', 'd3d7ed'],
  ['3750', 'アンティークブルー（極濃）', '384c5e'],
  ['3752', 'アンティークブルー（極淡）', 'c7d1db'],
  ['3755', 'ベビーブルー', '91b7d5'],
  ['3760', 'ウェッジウッド（中）', '3e85a2'],
  ['3765', 'ピーコックブルー（極濃）', '347f8c'],
  ['3766', 'ピーコックブルー（淡）', '99cfd9'],
  ['3801', 'メロン（極濃）', 'e74967'],
  ['3805', 'シクラメンピンク', 'f3478b'],
  ['3806', 'シクラメンピンク（淡）', 'ff8cae'],
  ['3810', 'ブルーグリーン', '488f92'],
  ['3820', 'ストロー（濃）', 'dfb65f'],
  ['3821', 'ストロー', 'f3ce75'],
  ['3822', 'ストロー（淡）', 'f6dc98'],
  ['3823', 'イエロー（ごく淡）', 'fffde3'],
  ['3837', 'ラベンダー（ごく濃）', '6c3a6e'],
  ['3838', 'ラベンダーブルー（濃）', '5c7294'],
  ['3839', 'ラベンダーブルー', '7b8eab'],
  ['3840', 'ラベンダーブルー（淡）', 'b0c0da'],
  ['3842', 'ウェッジウッド（極濃）', '32667c'],
  ['3843', 'エレクトリックブルー（中）', '14aad0'],
  ['3844', 'ブライトターコイズ（濃）', '12aeba'],
  ['3845', 'ブライトターコイズ', '04c4ca'],
  ['3846', 'ターコイズ', '36b8bd'],
  ['3850', 'ブライトグリーン（濃）', '378477'],
  ['3851', 'ブライトグリーン（淡）', '49b3a1'],
  ['3852', 'ストロー（極濃）', 'cd9d37'],
  ['3853', 'オータムゴールド（濃）', 'f29746'],
  ['3854', 'オータムゴールド', 'f2af68'],
  ['3855', 'オータムゴールド（淡）', 'fad396'],
  ['3857', 'ローズウッド（濃）', '68251a'],
  ['3858', 'ローズウッド', '964a3f'],
  ['3859', 'ローズウッド（淡）', 'ba8b7c'],
  ['3862', 'モカベージュ（濃）', '8a6e4e'],
  ['3863', 'モカベージュ', 'a4835c'],
  ['3864', 'モカベージュ（淡）', 'cbb69c'],
  ['3866', 'モカ（ごく淡）', 'faf6f0'],
].map(([id, name, hex]) => ({ id, name, hex: '#' + hex }));
/** How a coloured cell is painted: a full square (null), a half triangle, or an outline. */
export type CellStyle = 'tl' | 'tr' | 'bl' | 'br' | 'frame';
export const cellStyles: CellStyle[] = ['tl', 'tr', 'bl', 'br', 'frame'];
/** Backstitch segments inside one cell: four edges plus the two diagonals of the ×. */
export type LineSegment = 't' | 'r' | 'b' | 'l' | 'd' | 'u';
export const lineSegments: LineSegment[] = ['t', 'r', 'b', 'l', 'd', 'u'];
export type Pattern = {
  width: number;
  height: number;
  cells: (string | null)[];
  name: string;
  styles?: (CellStyle | null)[];
  // Each entry encodes "<thread id>:<segments>", e.g. "310:trd".
  lines?: (string | null)[];
};
export type Point = [number, number];
export function cellLines(
  p: Pattern,
  cell: number,
): { color: string; segments: string } | null {
  const raw = p.lines?.[cell];
  if (!raw) return null;
  const at = raw.indexOf(':');
  return { color: raw.slice(0, at), segments: raw.slice(at + 1) };
}
export function toggleCellLine(
  p: Pattern,
  cell: number,
  segment: LineSegment,
  color: string,
): Pattern {
  const current = cellLines(p, cell);
  const segments = current?.segments.includes(segment)
    ? current.segments.replace(segment, '')
    : (current?.segments || '') + segment;
  const lines = p.lines
    ? [...p.lines]
    : Array.from({ length: p.cells.length }, () => null);
  lines[cell] = segments ? `${current?.color || color}:${segments}` : null;
  return { ...p, lines };
}
export function cellStyle(p: Pattern, cell: number): CellStyle | null {
  return p.styles?.[cell] ?? null;
}
export function setCellStyle(
  p: Pattern,
  cell: number,
  style: CellStyle | null,
): Pattern {
  if (cellStyle(p, cell) === style) return p;
  const styles = p.styles
    ? [...p.styles]
    : Array.from({ length: p.cells.length }, () => null);
  styles[cell] = style;
  return { ...p, styles };
}
/** Remove only empty outer rows/columns; keep interior gaps and every thread. */
export function trimPattern(p: Pattern): Pattern {
  let left = p.width,
    top = p.height,
    right = -1,
    bottom = -1;
  p.cells.forEach((color, cell) => {
    if (color === null && !p.lines?.[cell]) return;
    const x = cell % p.width,
      y = Math.floor(cell / p.width);
    left = Math.min(left, x);
    right = Math.max(right, x);
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
  });
  if (
    right < 0 ||
    (left === 0 &&
      top === 0 &&
      right === p.width - 1 &&
      bottom === p.height - 1)
  )
    return p;
  const cells: Pattern['cells'] = [];
  const styles: Pattern['styles'] = p.styles && [];
  const lines: Pattern['lines'] = p.lines && [];
  for (let y = top; y <= bottom; y++) {
    cells.push(...p.cells.slice(y * p.width + left, y * p.width + right + 1));
    styles?.push(
      ...p.styles!.slice(y * p.width + left, y * p.width + right + 1),
    );
    lines?.push(...p.lines!.slice(y * p.width + left, y * p.width + right + 1));
  }
  return {
    ...p,
    width: right - left + 1,
    height: bottom - top + 1,
    cells,
    ...(styles && { styles }),
    ...(lines && { lines }),
  };
}
export type Region = { x: number; y: number; width: number; height: number };
/**
 * Shift every stitch inside the region; vacated cells empty, covered cells are overwritten.
 * With `copy`, the source stitches stay where they were.
 */
export function moveRegion(
  p: Pattern,
  region: Region,
  dx: number,
  dy: number,
  copy = false,
): Pattern {
  if (dx === 0 && dy === 0) return p;
  const cells = [...p.cells];
  const styles = p.styles && [...p.styles];
  const lines = p.lines && [...p.lines];
  const moved: [
    number,
    number,
    string | null,
    CellStyle | null,
    string | null,
  ][] = [];
  for (let y = region.y; y < region.y + region.height; y++)
    for (let x = region.x; x < region.x + region.width; x++) {
      const cell = y * p.width + x;
      const color = p.cells[cell];
      const line = p.lines?.[cell] ?? null;
      if (color === null && line === null) continue;
      if (!copy) {
        cells[cell] = null;
        if (styles) styles[cell] = null;
        if (lines) lines[cell] = null;
      }
      moved.push([x + dx, y + dy, color, cellStyle(p, cell), line]);
    }
  for (const [x, y, color, style, line] of moved) {
    if (x < 0 || y < 0 || x >= p.width || y >= p.height) continue;
    const cell = y * p.width + x;
    cells[cell] = color;
    if (styles) styles[cell] = style;
    if (lines) lines[cell] = line;
  }
  if (
    cells.every((c, i) => c === p.cells[i]) &&
    (!lines || lines.every((l, i) => l === (p.lines?.[i] ?? null)))
  )
    return p;
  return { ...p, cells, ...(styles && { styles }), ...(lines && { lines }) };
}
/** Paint every cell in the region as a full square; a null colour empties it, backstitch included. */
export function fillRegion(
  p: Pattern,
  region: Region,
  color: string | null,
): Pattern {
  const cells = [...p.cells];
  const styles = p.styles && [...p.styles];
  const lines = p.lines && [...p.lines];
  for (let y = region.y; y < region.y + region.height; y++)
    for (let x = region.x; x < region.x + region.width; x++) {
      const cell = y * p.width + x;
      cells[cell] = color;
      if (styles) styles[cell] = null;
      if (lines && color === null) lines[cell] = null;
    }
  return { ...p, cells, ...(styles && { styles }), ...(lines && { lines }) };
}
/** Change the canvas size, keeping stitches anchored top-left; overflow is cropped. */
export function resizePattern(
  p: Pattern,
  width: number,
  height: number,
): Pattern {
  if (width === p.width && height === p.height) return p;
  const cells: Pattern['cells'] = [];
  const styles: Pattern['styles'] = p.styles && [];
  const lines: Pattern['lines'] = p.lines && [];
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const inside = x < p.width && y < p.height;
      cells.push(inside ? p.cells[y * p.width + x] : null);
      styles?.push(inside ? p.styles![y * p.width + x] : null);
      lines?.push(inside ? p.lines![y * p.width + x] : null);
    }
  return {
    ...p,
    width,
    height,
    cells,
    ...(styles && { styles }),
    ...(lines && { lines }),
  };
}
/** Doubles the pattern: every cell becomes a 2×2 block, keeping triangles and backstitch lines in shape. */
export function doublePattern(p: Pattern): Pattern {
  const width = p.width * 2,
    height = p.height * 2;
  const cells: Pattern['cells'] = [];
  const styles: Pattern['styles'] = p.styles && [];
  const lines: Pattern['lines'] = p.lines && [];
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const from = (y >> 1) * p.width + (x >> 1);
      const dx = x & 1,
        dy = y & 1;
      let cell = p.cells[from];
      let style = p.styles?.[from] ?? null;
      if (style && style !== 'frame') {
        // A triangle's corner block is full, the opposite block is empty.
        const cx = style[1] === 'l' ? 0 : 1,
          cy = style[0] === 't' ? 0 : 1;
        if (dx === cx && dy === cy) style = null;
        else if (dx !== cx && dy !== cy) cell = style = null;
      }
      cells.push(cell);
      styles?.push(cell ? style : null);
      if (!lines) continue;
      const at = cellLines(p, from);
      const segments = (at?.segments || '')
        .split('')
        .filter(
          (s) =>
            (s === 't' && dy === 0) ||
            (s === 'b' && dy === 1) ||
            (s === 'l' && dx === 0) ||
            (s === 'r' && dx === 1) ||
            (s === 'd' && dx === dy) ||
            (s === 'u' && dx !== dy),
        )
        .join('');
      lines.push(segments ? `${at!.color}:${segments}` : null);
    }
  return {
    ...p,
    width,
    height,
    cells,
    ...(styles && { styles }),
    ...(lines && { lines }),
  };
}
export type Stitch = {
  color: string;
  cell: number;
  from: Point;
  to: Point;
  kind: 'start' | 'forward' | 'turn' | 'return' | 'jump' | 'cut';
  travel: number;
};
export function baselineRoute(p: Pattern): Stitch[] {
  const result: Stitch[] = [];
  for (const color of [...new Set(p.cells.filter(Boolean))] as string[]) {
    let previous: Point | undefined;
    for (let y = 0; y < p.height; y++)
      for (let x = 0; x < p.width; x++) {
        if (p.cells[y * p.width + x] !== color) continue;
        const start = x;
        while (x + 1 < p.width && p.cells[y * p.width + x + 1] === color) x++;
        const end = x;
        for (let a = start; a <= end; a++) {
          let from: Point = [a, y],
            to: Point = [a + 1, y + 1];
          // Never exit the hole just entered: it would undo the previous stitch.
          // Reversing this diagonal preserves the lower \ while choosing another exit.
          if (previous && from[0] === previous[0] && from[1] === previous[1]) {
            [from, to] = [to, from];
          }
          const travel = previous
            ? Math.hypot(from[0] - previous[0], from[1] - previous[1])
            : 0;
          const kind = !previous
            ? 'start'
            : a === start
              ? travel > 3
                ? 'cut'
                : 'jump'
              : 'forward';
          result.push({ color, cell: y * p.width + a, from, to, kind, travel });
          previous = to;
        }
        for (let a = end; a >= start; a--) {
          const from: Point = [a + 1, y],
            to: Point = [a, y + 1];
          result.push({
            color,
            cell: y * p.width + a,
            from,
            to,
            kind: a === end ? 'turn' : 'return',
            travel: Math.hypot(from[0] - previous![0], from[1] - previous![1]),
          });
          previous = to;
        }
      }
  }
  return result;
}
type Variant = Stitch[];
const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function variants(p: Pattern, color: string): Variant[] {
  const groups: Stitch[][] = [];
  for (const s of baselineRoute(p).filter((s) => s.color === color)) {
    if (['start', 'jump', 'cut'].includes(s.kind)) groups.push([]);
    groups.at(-1)!.push(s);
  }
  return groups.flatMap((group) => {
    const cells = group.slice(0, group.length / 2).map((s) => s.cell);
    return [false, true].map((reverse) => {
      const ordered = reverse ? [...cells].reverse() : cells;
      const result: Stitch[] = [];
      for (const upper of [false, true])
        for (const cell of upper ? [...ordered].reverse() : ordered) {
          const x = cell % p.width,
            y = Math.floor(cell / p.width);
          let from: Point = upper ? [x + 1, y] : [x, y];
          let to: Point = upper ? [x, y + 1] : [x + 1, y + 1];
          if (reverse) [from, to] = [to, from];
          result.push({
            cell,
            color,
            from,
            to,
            kind:
              result.length === 0
                ? 'start'
                : upper
                  ? result.length === cells.length
                    ? 'turn'
                    : 'return'
                  : 'forward',
            travel: 0,
          });
        }
      return result;
    });
  });
}
// Keep each edge-connected region together, visiting its runs top-to-bottom,
// then left-to-right. Union adjacent rows through their occupied cells so a
// split row that rejoins below still belongs to the same region.
function readingOrder(
  vs: Variant[],
  width: number,
  cellCount: number,
): number[] {
  const n = vs.length / 2;
  const parents = Array.from({ length: n }, (_, i) => i);
  const owner = new Int32Array(cellCount);
  owner.fill(-1);
  function root(id: number): number {
    while (parents[id] !== id) {
      parents[id] = parents[parents[id]];
      id = parents[id];
    }
    return id;
  }
  for (let id = 0; id < n; id++) {
    const run = vs[id * 2];
    for (let i = 0; i < run.length / 2; i++) {
      const cell = run[i].cell;
      owner[cell] = id;
      if (cell >= width && owner[cell - width] !== -1)
        parents[root(id)] = root(owner[cell - width]);
    }
  }
  const regions = new Map<number, number[]>();
  for (let id = 0; id < n; id++) {
    const key = root(id);
    if (!regions.has(key)) regions.set(key, []);
    regions.get(key)!.push(id);
  }
  return [...regions.values()].flat();
}
function enter(v: Variant, previous?: Point): Stitch[] {
  const copy = v.map((s) => ({ ...s }));
  if (previous && distance(previous, copy[0].from) === 0)
    [copy[0].from, copy[0].to] = [copy[0].to, copy[0].from];
  copy.forEach((s, i) => {
    const prev = i ? copy[i - 1].to : previous;
    s.travel = prev ? distance(prev, s.from) : 0;
    if (!i) s.kind = !prev ? 'start' : s.travel > 3 ? 'cut' : 'jump';
  });
  return copy;
}
export function routeMetrics(steps: Stitch[]) {
  return {
    cuts: steps.filter((s) => s.kind === 'cut').length,
    backLength: steps.reduce(
      (sum, s) => sum + (['cut', 'start'].includes(s.kind) ? 0 : s.travel),
      0,
    ),
  };
}
// Lexicographic objective: cuts first, then actual back-thread length (cut gaps excluded).
// This weight exceeds the maximum possible back-thread length of a 120×120 pattern.
const CUT_WEIGHT = 1_000_000;
function score(steps: Stitch[]) {
  const m = routeMetrics(steps);
  return m.cuts * CUT_WEIGHT + m.backLength;
}
export type Optimization = {
  steps: Stitch[];
  before: ReturnType<typeof routeMetrics>;
  after: ReturnType<typeof routeMetrics>;
  /** Directions are optimal for the fixed region/row order, not all permutations. */
  exact: boolean;
  runs: number;
};
const optimizationCache = new WeakMap<Pattern, Map<string, Optimization>>();
export function optimizeColor(p: Pattern, color: string): Optimization {
  let cache = optimizationCache.get(p);
  if (!cache) {
    cache = new Map();
    optimizationCache.set(p, cache);
  }
  const cached = cache.get(color);
  if (cached) return cached;
  const vs = variants(p, color),
    n = vs.length / 2;
  const base = baselineRoute(p).filter((s) => s.color === color);
  if (!n) {
    const empty = {
      steps: [],
      before: routeMetrics([]),
      after: routeMetrics([]),
      exact: true,
      runs: 0,
    };
    cache.set(color, empty);
    return empty;
  }
  const internal = vs.map((v) => score(enter(v)));
  const edge = (a: number, b: number) => {
    const v = vs[b],
      previous = vs[a].at(-1)!.to;
    let from = v[0].from,
      to = v[0].to;
    if (distance(previous, from) === 0) [from, to] = [to, from];
    const gap = distance(previous, from);
    const delta = distance(to, v[1].from) - distance(v[0].to, v[1].from);
    return internal[b] + delta + (gap > 3 ? CUT_WEIGHT : gap);
  };
  const runs = readingOrder(vs, p.width, p.cells.length);
  // The run order expresses readability. Optimize only the two entry directions
  // along that order; never trade skipped rows for a shorter thread.
  // State: (run position, direction). Each transition uses the actual holes,
  // including the first-diagonal reversal needed to avoid undoing a stitch.
  const parents = new Int8Array(n * 2);
  let costs = [internal[runs[0] * 2], internal[runs[0] * 2 + 1]];
  for (let i = 1; i < n; i++) {
    const nextCosts = [Infinity, Infinity];
    for (let direction = 0; direction < 2; direction++) {
      const next = runs[i] * 2 + direction;
      for (let previous = 0; previous < 2; previous++) {
        const cost = costs[previous] + edge(runs[i - 1] * 2 + previous, next);
        if (cost < nextCosts[direction] - 1e-8) {
          nextCosts[direction] = cost;
          parents[i * 2 + direction] = previous;
        }
      }
    }
    costs = nextCosts;
  }
  const order = Array.from({ length: n }, () => 0);
  let direction = costs[1] < costs[0] - 1e-8 ? 1 : 0;
  for (let i = n - 1; i >= 0; i--) {
    order[i] = runs[i] * 2 + direction;
    direction = parents[i * 2 + direction];
  }
  let previous: Point | undefined;
  const steps = order.flatMap((id) => {
    const s = enter(vs[id], previous);
    previous = s.at(-1)!.to;
    return s;
  });
  const result = {
    steps,
    before: routeMetrics(base),
    after: routeMetrics(steps),
    // Exact only for the fixed reading order, not all run permutations.
    exact: true,
    runs: n,
  };
  cache.set(color, result);
  return result;
}
export function route(p: Pattern): Stitch[] {
  return ([...new Set(p.cells.filter(Boolean))] as string[]).flatMap(
    (c) => optimizeColor(p, c).steps,
  );
}
const rgb = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
// Perceptual distance in CIE Lab, with sRGB/D65 conversion.
function lab(c: number[]) {
  const v = c.map((n) => {
    n /= 255;
    return n > 0.04045 ? ((n + 0.055) / 1.055) ** 2.4 : n / 12.92;
  });
  const [r, g, b] = v;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047),
    y = f(r * 0.2126 + g * 0.7152 + b * 0.0722),
    z = f((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
const labs = threads.map((t) => lab(rgb(t.hex)));
const dist = (a: number[], b: number[]) =>
  a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0);
// The picker offers about a third of the threads: starting from white and black,
// keep adding whichever thread is farthest from every pick so near-duplicates drop out.
const spread = [0, threads.findIndex((t) => t.id === '310')];
while (spread.length < Math.round(threads.length / 3)) {
  const gap = (i: number) =>
    Math.min(...spread.map((j) => dist(labs[i], labs[j])));
  spread.push(labs.reduce((best, _, i) => (gap(i) > gap(best) ? i : best), 0));
}
// Swatch order for pickers: whites, blacks and greys first, then hue families
// from pink round the wheel to purple, each running light to dark.
const colorRank = ([l, a, b]: number[]) => {
  if (Math.hypot(a, b) < 10) return [0, l >= 88 ? 0 : l < 30 ? 1 : 2, -l];
  const hue = ((Math.atan2(b, a) * 180) / Math.PI + 380) % 360;
  return [1, Math.floor(hue / 30), -l];
};
export const threadsByColor: Thread[] = spread
  .map((i) => ({ t: threads[i], rank: colorRank(labs[i]) }))
  .sort(
    (x, y) =>
      x.rank[0] - y.rank[0] || x.rank[1] - y.rank[1] || x.rank[2] - y.rank[2],
  )
  .map(({ t }) => t);
export function quantize(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  count: number,
  name: string,
): Pattern {
  const pixels = Array.from({ length: width * height }, (_, i) =>
    data[i * 4 + 3] < 80 ? null : lab(Array.from(data.slice(i * 4, i * 4 + 3))),
  );
  const nearest = (p: number[], ids: number[]) =>
    ids.reduce(
      (best, id) => (dist(p, labs[id]) < dist(p, labs[best]) ? id : best),
      ids[0],
    );
  const ids = threads.map((_, i) => i);
  const frequency = new Map<number, number>();
  pixels.forEach((p) => {
    if (p) {
      const id = nearest(p, ids);
      frequency.set(id, (frequency.get(id) || 0) + 1);
    }
  });
  const candidates = [...frequency.keys()];
  const selected: number[] = [];
  // Greedily minimize total approximation error, weighting every original colour.
  while (selected.length < Math.min(count, candidates.length)) {
    let best = -1,
      score = Infinity;
    for (const id of candidates.filter((i) => !selected.includes(i))) {
      const palette = [...selected, id];
      const error = [...frequency].reduce(
        (s, [i, n]) => s + n * dist(labs[i], labs[nearest(labs[i], palette)]),
        0,
      );
      if (error < score) {
        score = error;
        best = id;
      }
    }
    selected.push(best);
  }
  return {
    width,
    height,
    name,
    cells: pixels.map((p) => (p ? threads[nearest(p, selected)].id : null)),
  };
}
export function sample(): Pattern {
  // An abstract stitch sampler exercises runs, returns, gaps, and thread changes.
  const width = 24,
    height = 24;
  const cells = Array.from({ length: width * height }, (_, i) => {
    const x = i % width,
      y = Math.floor(i / width);
    const d = Math.abs(x - 11.5) + Math.abs(y - 11.5);
    return d > 10
      ? null
      : d > 8
        ? '797'
        : d > 6
          ? '3755'
          : d > 4
            ? '743'
            : d > 2
              ? '321'
              : 'Blanc';
  });
  return { width, height, cells, name: 'ひし形のステッチサンプラー' };
}

export type RouteRun = {
  id: number;
  steps: (Stitch & { needleNumber: number })[];
};
export function colorRuns(pattern: Pattern, color: string): RouteRun[] {
  const runs: RouteRun[] = [];
  route(pattern)
    .filter((s) => s.color === color)
    .forEach((s, i) => {
      if (['start', 'jump', 'cut'].includes(s.kind)) {
        runs.push({ id: runs.length + 1, steps: [] });
      }
      runs[runs.length - 1].steps.push({ ...s, needleNumber: i + 1 });
    });
  return runs;
}

export function threadColorDistance(a: string, b: string): number {
  const i = threads.findIndex((t) => t.id === a),
    j = threads.findIndex((t) => t.id === b);
  return i < 0 || j < 0 ? Infinity : Math.sqrt(dist(labs[i], labs[j]));
}

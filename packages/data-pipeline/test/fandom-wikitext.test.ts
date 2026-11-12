import { describe, expect, it } from 'vitest';
import {
  buildRefIndex,
  citedChapter,
  cleanText,
  extractQualifiers,
  firstChapter,
  firstLinkTarget,
  isNonCanonItem,
  splitForms,
  splitItems,
} from '../src/parse/fandom/clean.js';
import { allTemplates, parseTemplate, sameTemplateName, splitTopLevel, topLevelTemplates } from '../src/parse/fandom/wikitext.js';

describe('wikitext', () => {
  it('découpe les paramètres au premier niveau seulement', () => {
    const t = parseTemplate('{{Char Box\n| name = A\n| first = [[Chapter 1|Ch.1]]{{Qref|chap=1|x}}\n| pos}}');
    expect(t.name).toBe('Char Box');
    expect(t.named.get('name')).toBe('A');
    expect(t.named.get('first')).toBe('[[Chapter 1|Ch.1]]{{Qref|chap=1|x}}');
    expect(t.positional).toEqual([' pos']);
  });

  it('trouve un template imbriqué dans un #ifeq (Tabs Top)', () => {
    const text = '{{Tabs|root=X}}\n{{#ifeq: {{SUBPAGENAME}} | Gallery | | {{Char Box\n| name = Luffy }} }}';
    expect(topLevelTemplates(text).map((t) => t.name)).toEqual(['Tabs', '#ifeq: {{SUBPAGENAME}}']);
    expect(allTemplates(text).find((t) => t.name === 'Char Box')?.named.get('name')).toBe('Luffy');
  });

  it('compare les noms de templates comme MediaWiki', () => {
    expect(sameTemplateName('qref', 'Qref')).toBe(true);
    expect(sameTemplateName('Template:Char_Box', 'Char Box')).toBe(true);
    expect(sameTemplateName('QRef', 'Qref')).toBe(false);
  });

  it('ne coupe pas à l’intérieur des liens', () => {
    expect(splitTopLevel('[[a|b]]|c', '|')).toEqual(['[[a|b]]', 'c']);
  });
});

describe('nettoyage des valeurs', () => {
  it('rend Nihongo, Ruby, W, liens et supprime références et mise en forme', () => {
    expect(cleanText('モンキー・{{Ruby|D|ディー}}・ルフィ')).toBe('モンキー・D・ルフィ');
    expect(cleanText("''Monkī Dī Rufi''")).toBe('Monkī Dī Rufi');
    expect(cleanText('{{Nihongo|Straw Hat Luffy|麦わらのルフィ|Mugiwara no Rufi}}{{Qref|name=E|chap=2}}')).toBe(
      'Straw Hat Luffy',
    );
    expect(cleanText('[[Will of D.|Clan of D.]]<!-- x --><ref>y</ref>')).toBe('Clan of D.');
    expect(cleanText('{{W|Mayumi Tanaka}}')).toBe('Mayumi Tanaka');
    expect(cleanText('{{B}}<s>30,000,000</s>')).toBe('30,000,000');
  });

  it('gère un Qref imbriqué dans un Nihongo', () => {
    expect(cleanText('{{Nihongo|Luffy-tarou{{Qref|name=i|data=vivre card}}|ルフィ太郎|Rufitarō}}')).toBe('Luffy-tarou');
  });

  it('découpe sur <br>, ; et puces, sans couper dans les templates ni les entités', () => {
    expect(splitItems('[[A]];<br/>\n[[B]] (former);{{Qref|chap=1|a; b}}<br/>\n[[C]]')).toEqual([
      '[[A]]',
      '[[B]] (former)',
      '[[C]]',
    ]);
    expect(splitItems('*38 (first death);{{Qref|x}}\n*88 (debut)')).toEqual(['38 (first death)', '88 (debut)']);
    expect(splitItems('Smoker (VIZ, Funimation),<br />Chaser (4Kids)')).toEqual(['Smoker (VIZ, Funimation)', 'Chaser (4Kids)']);
    expect(splitItems('Personality&nbsp;and&nbsp;Relationships')).toEqual(['Personality and Relationships']);
  });

  it('découpe les formes d’un fruit sur ----', () => {
    expect(splitForms("''Gomu Gomu no Mi''\n----''Hito Hito no Mi''")).toEqual(["''Gomu Gomu no Mi''", "''Hito Hito no Mi''"]);
  });

  it('extrait les qualificatifs finaux', () => {
    expect(extractQualifiers('Baratie (temporary, former)')).toEqual({ text: 'Baratie', qualifiers: ['temporary', 'former'] });
    expect(extractQualifiers('Gol D. Roger')).toEqual({ text: 'Gol D. Roger', qualifiers: [] });
    expect(extractQualifiers('Big Mom (Funimation subs (formerly): Big Mam)').text).toBe('Big Mom');
    expect(extractQualifiers('(biologically 28)')).toEqual({ text: '(biologically 28)', qualifiers: [] });
    expect(extractQualifiers('91 cm (3\') (debut, child)')).toEqual({ text: '91 cm', qualifiers: ["3'", 'debut', 'child'] });
  });

  it('lit liens, chapitres, marqueurs non canon et références nommées', () => {
    expect(firstLinkTarget('[[Zoan#Mythical Zoan|Mythical Zoan]]')).toBe('Zoan');
    expect(firstLinkTarget('{{Qref|[[Nami]] says}} [[Straw Hat Pirates]]')).toBe('Straw Hat Pirates');
    expect(firstChapter('[[Chapter 159]]; [[Episode 95]] (silhouette)')).toBe(159);
    expect(isNonCanonItem('[[Nazawaka City]] (former){{Status|noncanon}}')).toBe(true);
    const refs = buildRefIndex('{{Qref|name=c1058|chap=1058|page=3}}');
    expect(citedChapter('{{B}}1,000{{Qref|name=c1058}}', refs)).toBe(1058);
    expect(citedChapter('{{B}}1{{Qref|sbs=4}}', refs)).toBeNull();
  });
});

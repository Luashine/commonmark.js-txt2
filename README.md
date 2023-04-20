# commonmark.js-txt2

**This is an experiment, a successful proof of concept for conversion
from Markdown to the [TXT2 format](https://xgm.guru/p/xgm/txt2)**.

## Features

- Added a custom renderer `txt2`
- Available from the `bin/commonmark` commandline:
	1. `npm install`
	2. `bin/commonmark --to txt2 simple.txt` to view the output in console
- Ordered list output is not correct for multi-level lists
- ~~Added~~ Hacked to add strikethrough support (upstream's wontfix until this is added to the
Commonmark standard aka NEVER)

## Goals

**Required output formats:**

1. TXT2
2. BB-Code (Xenforo flavour)

I wanted to see if it would be feasible to write a converter. Yes it is, but this library is not ideal.
I prefer to write basic documents/articles in the plaintext.md format, mostly for publication on Github.
Github supports some "non-standard" features such as `~~strikethrough~~` and tables.
While I don't require strikethrough, the tables are very handy to present certain types of data.
TXT2 supports both, but the table formatting is awful. Well to my taste the rest of TXT2 is poor for quick writing.
Maybe that's due to unfamiliar syntax.

## Results

This library allows for a quick implementation of custom renderers (output formats) and it was written with this
support in mind, HTML and XML renderers are separated, TXT2 is totally separate as you can see.

What's good about this lib? The AST parsing approach, the walker and the clear separation of renderers.

What's bad?

1. The main method of AST traversal is the "walker", however it only allows you to hook in the before/after events
(`entering` = true/false). I found no easy/sane way to intercept the actual content it is going to write, in other
words I missed a "middle" hook.
2. The API is poorly documented and designed (in this order). Different Markdown types write to different
object fields which is not explained and what goes where is not consistent.
3. To expand on the previous point, the types are all literal 'strings' scattered across the code etc.
4. Any extension of the rendering will need to heavily rely on lookaheads and lookbehinds to enrich the output,
to workaround the shortcomings.
5. I did not dare to look at the parser (called `block.js` iirc) to extend it. If I were, I'd rewrite half the library.
6. Does not support strikethrough and tables, support would be harder to add than expected for an "AST parsing approach".

## Sample

Input file `simple.md` (Markdown):

```markdown
# This is top level header

Just a text line

**bold** *italic* normal text ~~striked~~

This is a [link](https://wikipedia.org). Another <https://example.org>.

- List 1
- List 2

1. One
2. Two
3. Three

1. Misnumbered markdown list
1. Twp
2. Three

- First
    - Second
        - Third level
    1. One
    2. Two
        1. Two.One
        2. Two.Two
            1. Two.Two.One
            2. Two.Two.Two
            3. Two.Two.Three
- Back
- Just one more

![image 1 description](image.png)

![image 2 description](image.png "alt text")

The end!
```

Output file `simple.txt2` (TXT2 markup):

```
This is top level header
===

Just a text line
**bold** __italic__ normal text --striked--
This is a __link__(https://wikipedia.org). Another __https://example.org__(https://example.org).

- List 1
- List 2

1. One
2. Two
3. Three
1. Misnumbered markdown list
1. Twp
2. Three

- First
   - Second
      - Third level
   1. One
   2. Two
      1. Two.One
      2. Two.Two
         1. Two.Two.One
         2. Two.Two.Two
         3. Two.Two.Three
- Back
- Just one more
<> image.png - image 1 description

<> image.png - image 2 description (alt text)

The end!
```

The base functionality worked with relatively little effort. 

The ordered lists must be in this format: 1.2.2 for indentation level 3. Other than modifying the nodes themselves
(seemed weird), there's no built-in way to store additional data. It'd have been required for an accurate and
correct rendering here.

## The next library candidate

https://github.com/markdown-it/markdown-it

A quick look shows it's not really meant to have fully independent renderers out of the box,
but the base functionality is extensible/replacable enough to achieve this. Hopefully cleanly.
A huge benefit is the wide community support through additional plugins for the Markdown extensions out there.
And of course, strikethrough and table support by default.

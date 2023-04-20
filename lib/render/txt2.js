"use strict";

import Renderer from "./renderer.js";

// Helper function to produce an HTML tag.
function tag(name, attrs, selfclosing) {
    if (this.disableTags > 0) {
        return;
    }
    this.buffer += "{" + name;
    if (attrs && attrs.length > 0) {
        var i = 0;
        var attrib;
        while ((attrib = attrs[i]) !== undefined) {
            this.buffer += " " + attrib[0] + '="' + attrib[1] + '"';
            i++;
        }
    }
    if (selfclosing) {
        this.buffer += " /";
    }
    this.buffer += "}";
    this.lastOut = "}";
}

function Txt2Renderer(options) {
    options = options || {};
    // by default, soft breaks are rendered as newlines in HTML
    options.softbreak = options.softbreak || "\n";
    // set to "<br />" to make them hard breaks
    // set to " " if you want to ignore line wrapping in source
    this.esc = options.esc || function(s){return s;};
    // escape html with a custom function
    // else use escapeXml

    this.disableTags = 0;
    this.lastOut = "\n";
    this.options = options;

    this.indentLevel = -1; // root is -1
}


function esc(s) {
    return s; // NOP
};

/* Node methods */

// Processes regular text nodes
function text(node) {
    // @TODO: Strikethrough not available due to Jeff Atwood *not using it*
    // https://github.com/commonmark/commonmark.js/issues/120
    // https://talk.commonmark.org/t/strikeout-threw-out-strikethrough-strikes-out-throughout/820
    this.out(
        replaceStrikethrough(
            node.literal
        )
    );
}

let replaceStrikethrough = (function() {
    const pattern = new RegExp(/~~([^\s]+)~~/)
    return function(str) {
        return str.replace(pattern, "--$1--")
    }
})()

function softbreak() {
    this.lit(this.options.softbreak);
}

function newline() {
    this.lit("\n");
}

function newlineNoDup() {
    this.cr();
}

function link(node, entering) {
    var attrs = this.attrs(node);
    if (entering) {
        // node.destination = href
        // title = node.title ? is null
        this.lit("__");
        //this.lit(node.title);
    } else {
        // link name printed inbetween
        this.lit("__");
        this.lit("(");
        this.lit(node.destination);
        this.lit(")");
    }
}

function image(node, entering) {
    if (entering) {
        if (this.disableTags === 0) {
            this.lit("<> ");
            this.lit(node.destination);
            this.lit(" - "); // what follows is the regular description
        }
        this.disableTags += 1;
    } else {
        this.disableTags -= 1;
        // description text is inbetween
        if (this.disableTags === 0) {
            if (node.title) { // alt text
                this.lit(" (" + node.title + ")");
            }
            this.newline();
        }
    }
}

// emphasis aka italic
function emph(node, entering) {
    this.lit("__"); // double works for multi-word
}

// bold
function strong(node, entering) {
    this.lit("**");
}

function paragraph(node, entering) {
    if (entering) {

    } else {
        this.newline();
    }
    return; // disable all for now, see original html renderer
}

function heading(node, entering) {
    // HTML has 6 heading levels, txt2 only 3
    var headingLevel = Math.min(3, Math.ceil(node.level / 2));
    if (headingLevel == 1) {
        if (!entering) {
            this.newlineNoDup();
            this.out("===")
            this.newline();
            this.newline();
        }
    } else if (headingLevel == 2) {
        if (entering) {
            this.out("=== ");
        } else {
            this.out(" ===");
            this.newline();
            this.newline();
        }
    } else {
        // heading level 3
        if (entering) {
            this.out("=== ");
        } else {
            this.newline();
            this.newline();
        }
    }
}

function code(node) {
    this.out("`");
    this.out(node.literal);
    this.out("`");
}

function code_block(node) {
    var info_words = node.info ? node.info.split(/\s+/) : []
    if (info_words[0] && info_words[0].length) {
        // Language
        var language = info_words[0]
        this.out(language);
        this.newlineNoDup();
    }
    this.out("((код");
    this.newlineNoDup();
    this.out(node.literal);
    this.newlineNoDup();
    this.out("))")
}

function thematic_break(node) {
    var attrs = this.attrs(node);
    this.newlineNoDup();
    this.out("---");
    this.newlineNoDup();
}

function block_quote(node, entering) {
    var attrs = this.attrs(node);
    if (entering) {
        this.newlineNoDup();
        this.tag("((цитата", attrs);
        this.newlineNoDup();
    } else {
        this.newlineNoDup();
        this.tag("))");
        this.newlineNoDup();
    }
}

// List of items
function list(node, entering) {
    // same syntax as markdown except space amount is arbitrary
    if (entering) {
        if (this.indentLevel == -1) {
            // empty leading lines
            this.newlineNoDup();
            this.newline();
        } else {
            this.newlineNoDup();
        }
        this.indentLevel++;
    } else {
        this.newlineNoDup();
        this.indentLevel--;
    }
}

// list item / bullet point
function item(node, entering) {
    var listType = node.parent.listType;
    if (entering) {
        if (this.indentLevel > 0) {
            this.out("   ".repeat(this.indentLevel));    
        }
        // @TODO keep count and increase count
        this.out((listType === "bullet" ? "- " : node.listStart + ". "))
    } else {
        this.cr();
    }
}

function html_inline(node) {
    if (this.options.safe) {
        this.lit("<!-- raw HTML omitted -->");
    } else {
        this.lit(node.literal);
    }
}

function html_block(node) {
    this.cr();
    if (this.options.safe) {
        this.lit("<!-- raw HTML omitted -->");
    } else {
        this.lit(node.literal);
    }
    this.cr();
}

function custom_inline(node, entering) {
    if (entering && node.onEnter) {
        this.lit(node.onEnter);
    } else if (!entering && node.onExit) {
        this.lit(node.onExit);
    }
}

function custom_block(node, entering) {
    this.cr();
    if (entering && node.onEnter) {
        this.lit(node.onEnter);
    } else if (!entering && node.onExit) {
        this.lit(node.onExit);
    }
    this.cr();
}

/* Helper methods */

function out(s) {
    this.lit(this.esc(s));
}

function attrs(node) {
    var att = [];
    if (this.options.sourcepos) {
        var pos = node.sourcepos;
        if (pos) {
            att.push([
                "data-sourcepos",
                String(pos[0][0]) +
                    ":" +
                    String(pos[0][1]) +
                    "-" +
                    String(pos[1][0]) +
                    ":" +
                    String(pos[1][1])
            ]);
        }
    }
    return att;
}

// quick browser-compatible inheritance
Txt2Renderer.prototype = Object.create(Renderer.prototype);

Txt2Renderer.prototype.text = text;
Txt2Renderer.prototype.html_inline = html_inline;
Txt2Renderer.prototype.html_block = html_block;
Txt2Renderer.prototype.softbreak = softbreak;
Txt2Renderer.prototype.linebreak = newlineNoDup; // poor naming
Txt2Renderer.prototype.newlineNoDup = newlineNoDup; // add
Txt2Renderer.prototype.newline = newline; // add
Txt2Renderer.prototype.link = link;
Txt2Renderer.prototype.image = image;
Txt2Renderer.prototype.emph = emph;
Txt2Renderer.prototype.strong = strong;
Txt2Renderer.prototype.paragraph = paragraph;
Txt2Renderer.prototype.heading = heading;
Txt2Renderer.prototype.code = code;
Txt2Renderer.prototype.code_block = code_block;
Txt2Renderer.prototype.thematic_break = thematic_break;
Txt2Renderer.prototype.block_quote = block_quote;
Txt2Renderer.prototype.list = list;
Txt2Renderer.prototype.item = item;
Txt2Renderer.prototype.custom_inline = custom_inline;
Txt2Renderer.prototype.custom_block = custom_block;

Txt2Renderer.prototype.esc = esc;

Txt2Renderer.prototype.out = out;
Txt2Renderer.prototype.tag = tag;
Txt2Renderer.prototype.attrs = attrs;

export default Txt2Renderer;

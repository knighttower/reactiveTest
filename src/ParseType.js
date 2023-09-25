const identifierRegex = /[\$\w]+/;

function peek(tokens) {
    let token;
    token = tokens[0];
    if (token == null) {
        throw new Error('Unexpected end of input.');
    }
    return token;
}
function consumeIdent(tokens) {
    let token;
    token = peek(tokens);
    if (!identifierRegex.test(token)) {
        throw new Error("Expected text, got '" + token + "' instead.");
    }
    return tokens.shift();
}
function consumeOp(tokens, op) {
    let token;
    token = peek(tokens);
    if (token !== op) {
        throw new Error("Expected '" + op + "', got '" + token + "' instead.");
    }
    return tokens.shift();
}
function maybeConsumeOp(tokens, op) {
    let token;
    token = tokens[0];
    if (token === op) {
        return tokens.shift();
    } else {
        return null;
    }
}
function consumeArray(tokens) {
    let types;
    consumeOp(tokens, '[');
    if (peek(tokens) === ']') {
        throw new Error('Must specify type of Array - eg. [Type], got [] instead.');
    }
    types = consumeTypes(tokens);
    consumeOp(tokens, ']');
    return {
        structure: 'array',
        of: types,
    };
}
function consumeTuple(tokens) {
    let components;
    components = [];
    consumeOp(tokens, '(');
    if (peek(tokens) === ')') {
        throw new Error('Tuple must be of at least length 1 - eg. (Type), got () instead.');
    }
    for (;;) {
        components.push(consumeTypes(tokens));
        maybeConsumeOp(tokens, ',');
        if (')' === peek(tokens)) {
            break;
        }
    }
    consumeOp(tokens, ')');
    return {
        structure: 'tuple',
        of: components,
    };
}
function consumeFields(tokens) {
    let fields, subset, ref$, key, types;
    fields = {};
    consumeOp(tokens, '{');
    subset = false;
    for (;;) {
        if (maybeConsumeOp(tokens, '...')) {
            subset = true;
            break;
        }
        (ref$ = consumeField(tokens)), (key = ref$[0]), (types = ref$[1]);
        fields[key] = types;
        maybeConsumeOp(tokens, ',');
        if ('}' === peek(tokens)) {
            break;
        }
    }
    consumeOp(tokens, '}');
    return {
        structure: 'fields',
        of: fields,
        subset: subset,
    };
}
function consumeField(tokens) {
    let key, types;
    key = consumeIdent(tokens);
    consumeOp(tokens, ':');
    types = consumeTypes(tokens);
    return [key, types];
}
function maybeConsumeStructure(tokens) {
    switch (tokens[0]) {
        case '[':
            return consumeArray(tokens);
        case '(':
            return consumeTuple(tokens);
        case '{':
            return consumeFields(tokens);
    }
}
function consumeType(tokens) {
    let token, wildcard, type, structure;
    token = peek(tokens);
    wildcard = token === '*';
    if (wildcard || identifierRegex.test(token)) {
        type = wildcard ? consumeOp(tokens, '*') : consumeIdent(tokens);
        structure = maybeConsumeStructure(tokens);
        if (structure) {
            return (structure.type = type), structure;
        } else {
            return {
                type: type,
            };
        }
    } else {
        structure = maybeConsumeStructure(tokens);
        if (!structure) {
            throw new Error('Unexpected character: ' + token);
        }
        return structure;
    }
}
function consumeTypes(tokens) {
    let lookahead, types, typesSoFar, typeObj, type, structure;
    if ('::' === peek(tokens)) {
        throw new Error("No comment before comment separator '::' found.");
    }
    lookahead = tokens[1];
    if (lookahead != null && lookahead === '::') {
        tokens.shift();
        tokens.shift();
    }
    types = [];
    typesSoFar = {};
    if ('Maybe' === peek(tokens)) {
        tokens.shift();
        types = [
            {
                type: 'Undefined',
            },
            {
                type: 'Null',
            },
        ];
        typesSoFar = {
            Undefined: true,
            Null: true,
        };
    }
    for (;;) {
        (typeObj = consumeType(tokens)), (type = typeObj.type), (structure = typeObj.structure);
        if (!typesSoFar[type]) {
            types.push(typeObj);
        }
        if (structure == null) {
            typesSoFar[type] = true;
        }
        if (!maybeConsumeOp(tokens, '|')) {
            break;
        }
    }
    return types;
}
function in$(x, xs) {
    let i = -1,
        l = xs.length >>> 0;
    while (++i < l) if (x === xs[i]) return true;
    return false;
}

export default function (input) {
    let tokens, e;
    const tokenRegex = RegExp('\\.\\.\\.|::|->|' + identifierRegex.source + '|\\S', 'g');

    if (!input.length) {
        throw new Error('No type specified.');
    }
    tokens = input.match(tokenRegex) || [];
    if (in$('->', tokens)) {
        throw new Error(
            "Function types are not supported. To validate that something is a function, you may use 'Function'.",
        );
    }
    try {
        return consumeTypes(tokens);
    } catch (e$) {
        e = e$;
        throw new Error(
            e.message + ' - Remaining tokens: ' + JSON.stringify(tokens) + " - Initial input: '" + input + "'",
        );
    }
}

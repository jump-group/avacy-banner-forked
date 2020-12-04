import { patterns, TYPE_ATTRIBUTE } from './variables'

export const checkOnBlacklist = (src, type) => {
    let index;
    let found = false;
    let rules = {};

    if (!type || type !== TYPE_ATTRIBUTE) {
        index = patterns.blacklist.findIndex(item => item.pattern.test(src))
        found = index !== -1;
    }

    if (found) {
        rules = patterns.blacklist[index].rules;
    }

    return [found, rules];
}

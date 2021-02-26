export const TYPE_ATTRIBUTE = 'as-oil';

export const patterns = setPattern();

function setPattern() {
    if (window.CLIENT_SIDE_BLOCKING) {
        return {
            blacklist: window.CLIENT_SIDE_BLOCKING.blacklist
        }
    }

    // TODO: Qui tornerei un default
    return [];
}



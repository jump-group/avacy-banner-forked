export const closeWithoutConsents = (closeWithoutConsents) => {
    return closeWithoutConsents === true ? '<span class="as-oil__close-banner as-js-close-banner"></span>' : '';
}

export const bannerLogo = (logoUrl) => {
    return logoUrl !== false ? `
        <div class="as-oil__banner-logo">
            <img src=${logoUrl}>
        </div>
    ` : '';
}
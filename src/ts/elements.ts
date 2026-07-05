function element(elementType: string, classes: string | string[], textContent?: string): any {
    const result = document.createElement(elementType);
    if (Array.isArray(classes)) {
        result.classList.add(...classes);
    } else {
        result.classList.add(classes);
    }
    if (textContent) {
        result.textContent = textContent;
    }
    return result;
}


export function div(classes: string | string[], textContent?: string): HTMLDivElement {
    return element("div", classes, textContent);
}


export function button(classes: string | string[], textContent?: string, onClick?: CallableFunction): HTMLButtonElement {
    const result: HTMLButtonElement = element("button", classes, textContent);
    if (onClick) {
        result.addEventListener("click", ev => {
            onClick(ev);
        });
    }
    return result;
}


export function img(classes: string | string[], url: string): HTMLImageElement {
    const result: HTMLImageElement = element("img", classes);
    result.src = url;
    return result;
}


export function h1(classes: string | string[], textContent?: string): HTMLHeadingElement {
    return element("h1", classes, textContent);
}


export function h2(classes: string | string[], textContent?: string): HTMLHeadingElement {
    return element("h2", classes, textContent);
}


export function h3(classes: string | string[], textContent?: string): HTMLHeadingElement {
    return element("h3", classes, textContent);
}


export function h4(classes: string | string[], textContent?: string): HTMLHeadingElement {
    return element("h4", classes, textContent);
}


export function h5(classes: string | string[], textContent?: string): HTMLHeadingElement {
    return element("h5", classes, textContent);
}


export function h6(classes: string | string[], textContent?: string): HTMLHeadingElement {
    return element("h6", classes, textContent);
}

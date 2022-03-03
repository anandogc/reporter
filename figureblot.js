// https://gist.github.com/tranduongms1/584d43ec7d8ddeab458f087adbeef950

const Module = Quill.import('core/module');
const BlockEmbed = Quill.import('blots/block/embed');

class FigureBlot extends BlockEmbed {
  static blotName = 'image';
  static tagName = ['figure', 'image'];

  static create(value) {
    let node = super.create();
    let img = window.document.createElement('img');
    if (value.alt || value.caption) {
      img.setAttribute('alt', value.alt || value.caption);
    }
    if (value.src || typeof value === 'string') {
      img.setAttribute('src', value.src || value);
    }
    node.appendChild(img);
    if (value.caption) {
      let caption = window.document.createElement('figcaption');
      caption.innerHTML = value.caption;
      node.appendChild(caption);
    }
    node.className = 'ql-card-editable ql-card-figure';
    return node;
  }

  constructor(node) {
    super(node);
    node.style = "position: relative;"
    node.__onSelect = () => {
      if (!node.querySelector('textarea')) {
        let caption = node.querySelector('figcaption');
        let captionInput = window.document.createElement('textarea');
        captionInput.placeholder = 'Type your caption...';
        if (caption) {
          captionInput.value = caption.innerText;
          caption.innerHTML = '';
          caption.appendChild(captionInput);
        } else {
          caption = window.document.createElement('figcaption');
          caption.appendChild(captionInput);
          node.appendChild(caption);
        }

        let removefig = window.document.createElement('button');
        removefig.innerHTML = "x";
        removefig.style = "position: absolute; top: 0; right: 5px;"
        removefig.onclick = function(e) {
            node.remove();
        };
        node.appendChild(removefig);

        node.addEventListener('blur', () => {
          removefig.remove();
        })
        
        captionInput.addEventListener('blur', () => {
          let value = captionInput.value;
          if (!value || value === '') {
            caption.remove();
          } else {
            captionInput.remove();
            caption.innerText = value;
          }
        });
        captionInput.focus();
      }
    }
  }

  static value(node) {
    let img = node.querySelector('img');
    let figcaption = node.querySelector('figcaption');
    if (!img) return false;
    return {
      alt: img.getAttribute('alt'),
      src: img.getAttribute('src'),
      caption: figcaption ? figcaption.innerText : null
    };
  }
}

class CardEditableModule extends Module {
    constructor(quill, options) {
        super(quill, options);
        let listener = (e) => {
            if (!document.body.contains(quill.root)) {
                return document.body.removeEventListener('click', listener);
            }
            let elm = e.target.closest('.ql-card-editable');
            let deselectCard = () => {
                if (elm.__onDeselect) {
                    elm.__onDeselect(quill);
                } else {
                    quill.setSelection(quill.getIndex(elm.__blot.blot) + 1, 0, Quill.sources.USER);
                }
            }
            if (elm && elm.__blot && elm.__onSelect) {
                quill.disable();
                elm.__onSelect(quill);
                let handleKeyPress = (e) => {
                    if (e.keyCode === 27 || e.keyCode === 13) {
                        window.removeEventListener('keypress', handleKeyPress);
                        quill.enable(true);
                        deselectCard();
                    }
                }
                let handleClick = (e) => {
                    if (e.which === 1 && !elm.contains(e.target)) {
                        window.removeEventListener('click', handleClick);
                        quill.enable(true);
                        deselectCard();
                    }
                }
                window.addEventListener('keypress', handleKeyPress);
                window.addEventListener('click', handleClick);
            }
        };
        quill.emitter.listenDOM('click', document.body, listener);
    }
}

Quill.register({
    // Other formats or modules
    'formats/image': FigureBlot,
    'modules/cardEditable': CardEditableModule,
}, true);
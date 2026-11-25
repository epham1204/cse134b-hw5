// fact-viewer.js
// A small Web Component that shows random facts from the Useless Facts API.

const FACT_ENDPOINT = 'https://uselessfacts.jsph.pl/api/v2/facts/random?language=en';

// Return the URL only if it is a valid https address, otherwise null.
function safeHttpsUrl(value) {
  if (typeof value !== 'string') {
    return null;
  }
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : null;
  } catch (error) {
    return null; // not a valid URL at all
  }
}

class FactViewer extends HTMLElement {
  // Attributes the browser should watch on <fact-viewer>.
  static observedAttributes = ['compact'];

  constructor() {
    super();
    this.built = false;      // has the interface been created yet?
    this.loading = false;    // is a request in progress?
    this.loadedCount = 0;    // how many facts have loaded this visit
    this.hasSource = false;  // does the current fact have a source name?
    this.hasLink = false;    // does the current fact have a safe source link?
    this.statusMessage = ''; // status text before the compact note is added
  }

  // Runs when the element is added to the page.
  connectedCallback() {
    if (this.built) {
      return;
    }

    // Heading
    this.heading = document.createElement('h2');
    this.heading.textContent = 'Useless Fact Viewer';
    this.appendChild(this.heading);

    // Current item: the fact itself (always visible)
    this.factEl = document.createElement('p');
    this.factEl.textContent = 'No fact loaded yet.';
    this.appendChild(this.factEl);

    // Current item: details (hidden in compact mode)
    this.sourceEl = document.createElement('p');
    this.appendChild(this.sourceEl);

    this.linkPara = document.createElement('p');
    this.linkEl = document.createElement('a');
    this.linkEl.textContent = 'View the source of this fact';
    this.linkPara.appendChild(this.linkEl);
    this.appendChild(this.linkPara);

    // Status message (announced politely by screen readers when it changes)
    this.statusEl = document.createElement('p');
    this.statusEl.setAttribute('role', 'status');
    this.appendChild(this.statusEl);

    // Internal control
    this.factButton = document.createElement('button');
    this.factButton.type = 'button';
    this.factButton.textContent = 'New fact';
    this.factButton.addEventListener('click', () => {
      this.loadFact();
    });
    this.appendChild(this.factButton);

    this.built = true;
    this.applyCompact();
    this.loadFact(); // show a fact as soon as the page loads
  }

  // Runs whenever an observed attribute is added, removed, or changed.
  attributeChangedCallback(name) {
    // This can fire before connectedCallback if the attribute is in the HTML,
    // so only update once the interface exists.
    if (name === 'compact' && this.built) {
      this.applyCompact();
    }
  }

  // Request a fact from the API and update the interface.
  async loadFact() {
    if (this.loading) {
      return; // ignore presses while a request is already pending
    }

    this.setLoading(true);
    this.setStatus('Loading a fact…');

    try {
      const response = await fetch(FACT_ENDPOINT, {
        headers: { Accept: 'application/json' }
      });

      // An HTTP error such as 404 or 500 still returns a response.
      if (!response.ok) {
        throw new Error('HTTP status ' + response.status);
      }

      const data = await response.json();

      // The fact text is required. Stop if it is missing or not text.
      if (typeof data?.text !== 'string' || data.text.trim() === '') {
        throw new Error('Expected fact text in the response.');
      }

      this.showFact(data);
      this.loadedCount += 1;
      this.factButton.textContent = 'New fact';
      this.setStatus('Fact loaded (' + this.loadedCount + ' this visit).');
    } catch (error) {
      // Network failures, bad status codes, invalid JSON, and missing
      // fields all end up here. Any earlier fact stays on screen.
      console.error('Could not load a fact.', error);
      this.factButton.textContent = 'Try again';
      this.setStatus('Could not load a fact. Check your connection and press Try again.');
    } finally {
      // Restore the control after either outcome.
      this.setLoading(false);
    }
  }

  // Put a checked fact into the interface. Remote text only goes in
  // through textContent, never innerHTML.
  showFact(data) {
    this.factEl.textContent = data.text.trim();

    // Source name is optional.
    this.hasSource = typeof data.source === 'string' && data.source.trim() !== '';
    this.sourceEl.textContent = this.hasSource ? 'Source: ' + data.source.trim() : '';

    // Source link is optional and must be a valid https URL.
    const url = safeHttpsUrl(data.source_url);
    this.hasLink = url !== null;
    if (this.hasLink) {
      this.linkEl.href = url;
    } else {
      this.linkEl.removeAttribute('href');
    }

    this.applyCompact();
  }

  // Mark the button as busy. aria-disabled is used instead of the disabled
  // attribute so keyboard focus stays on the button during the request;
  // the this.loading check in loadFact() is what blocks extra presses.
  setLoading(isLoading) {
    this.loading = isLoading;
    if (isLoading) {
      this.factButton.setAttribute('aria-disabled', 'true');
    } else {
      this.factButton.removeAttribute('aria-disabled');
    }
  }

  // Show or hide the extra details based on the compact attribute.
  // Details that the current fact does not have stay hidden either way.
  applyCompact() {
    const compact = this.hasAttribute('compact');

    this.sourceEl.hidden = compact || !this.hasSource;
    this.linkPara.hidden = compact || !this.hasLink;

    this.renderStatus();
  }

  setStatus(message) {
    this.statusMessage = message;
    this.renderStatus();
  }

  renderStatus() {
    let text = this.statusMessage;
    if (this.hasAttribute('compact')) {
      text += ' (compact view)';
    }
    this.statusEl.textContent = text;
  }
}

customElements.define('fact-viewer', FactViewer);

// Page control: the external button that toggles the compact attribute
// and remembers the choice.
// Expects <button id="toggle-compact" hidden> and one <fact-viewer> on the page.
const MODE_KEY = 'hw5-fact-viewer-mode';
const DEFAULT_MODE = 'expanded';

const toggleButton = document.querySelector('#toggle-compact');
const viewer = document.querySelector('fact-viewer');

// Read the saved mode. Storage can be blocked, and the saved value could be
// anything, so fall back to the default unless it is a value we expect.
function readSavedMode() {
  try {
    const saved = localStorage.getItem(MODE_KEY);
    return saved === 'compact' || saved === 'expanded' ? saved : DEFAULT_MODE;
  } catch (error) {
    return DEFAULT_MODE;
  }
}

// Save the mode. If storage is blocked the choice still applies on this page.
function saveMode(mode) {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch (error) {
    console.log('Fact viewer mode could not be saved:', error);
  }
}

// One path for both the restored choice and the button: set or remove the
// observed attribute (the component reacts in attributeChangedCallback),
// then keep the button label in step.
function applyMode(mode) {
  const compact = mode === 'compact';
  viewer.toggleAttribute('compact', compact);
  toggleButton.textContent = compact ? 'Show details' : 'Hide details';
}

if (toggleButton && viewer) {
  // Restore the saved choice when the page loads.
  applyMode(readSavedMode());

  toggleButton.addEventListener('click', () => {
    const mode = viewer.hasAttribute('compact') ? 'expanded' : 'compact';
    applyMode(mode); // apply immediately
    saveMode(mode);  // then save
  });

  // Reveal the button now that it works (it stays hidden without JavaScript).
  toggleButton.hidden = false;
}
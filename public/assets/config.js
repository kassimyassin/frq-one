// The few switches of the site. Everything else is in index.html.
window.FRQ_CONFIG = {
  // The table that sets Faruq next to Jev and other small models. Keep it off until Faruq's
  // final numbers exist. To look at it without switching it on, open the page with ?compare=1
  showComparison: false,

  // Where "Get early access" sends what people fill in. Set ONE of the two.
  //   endpoint: the address of a form service or of your own script; the form is POSTed to it.
  //   email:    with no endpoint, the visitor's own mail program opens with a message to this address.
  // With both empty the form tells the visitor that sign-up is not open yet and sends nothing.
  earlyAccess: {
    endpoint: '',
    email: ''
  }
};

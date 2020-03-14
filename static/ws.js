const ws = new WebSocket('ws://127.0.0.1:2020/ws');

ws.onopen = _ => {
  ws.send('ready');
};

ws.onmessage = e => {
  if (e.data === 'change' && window.ui) {
    window.ui.specActions.updateLoadingStatus('loading');
    window.ui.specActions.updateUrl('/spec');
    window.ui.specActions.download();
  }
};


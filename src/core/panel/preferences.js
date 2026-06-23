  let preferenceStatus = '';
  function refreshPreferenceFields() {
    if (!settingsPanel) return;
    const status = settingsPanel.querySelector('[data-preference-status]');
    if (status) { status.textContent = preferenceStatus; status.hidden = !preferenceStatus; }
    for (const key of ['sourceRoot', 'preset']) {
      const field = settingsPanel.querySelector('[data-preference="' + key + '"]');
      if (field && document.activeElement !== field) field.value = settings[key] || '';
    }
  }
  function persistPreferences() {
    try {
      localStorage.setItem(NS + '-settings', JSON.stringify(settings));
      preferenceStatus = '';
    } catch (_) { preferenceStatus = '无法保存当前网站设置'; }
    refreshPreferenceFields();
  }

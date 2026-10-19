(async () => {
    'use strict';
    const form = document.getElementById('booking-form');
    if (!form)
        return;
    const $ = id => document.getElementById(id);
    const fields = { brand: $('brand'), model: $('model'), showroom: $('showroom') };
    let catalog;
    try {
        const response = await fetch('/catalog.json');
        if (!response.ok)
            throw Error();
        catalog = (await response.json()).brands;
    }
    catch {
        $('submit-error').textContent = 'The car directory could not load. Please refresh and try again.';
        document.querySelectorAll('.next-step').forEach(b => b.disabled = true);
        const error = document.createElement('p');
        error.className = 'step-error';
        error.textContent = 'The car directory could not load. Please refresh to continue.';
        form.querySelector('[data-step="0"]').append(error);
        return;
    }
    const option = (label, value = label) => { const o = document.createElement('option'); o.textContent = label; o.value = value; return o; };
    Object.keys(catalog).forEach(brand => fields.brand.append(option(brand)));
    fields.brand.append(option('Other brand', 'Other'));
    function fill(select, items, label) { select.replaceChildren(option(label, ''), ...items.map(x => option(x)), option('Other / not listed', 'Other')); select.disabled = false; }
    function custom(field) { const isOther = fields[field].value === 'Other'; $(`custom-${field}-field`).hidden = !isOther; $(`custom-${field}`).required = isOther; if (!isOther)
        $(`custom-${field}`).value = ''; }
    fields.brand.addEventListener('change', () => { const item = catalog[fields.brand.value]; fill(fields.model, item?.models || [], 'Choose your model'); fill(fields.showroom, item?.showrooms || [], 'Choose your showroom'); if (!fields.brand.value) {
        fields.model.disabled = fields.showroom.disabled = true;
    } if (fields.brand.value === 'Other') {
        fields.model.value = fields.showroom.value = 'Other';
    } custom('model'); custom('showroom'); updateSummary(); });
    for (const field of ['model', 'showroom'])
        fields[field].addEventListener('change', () => { custom(field); updateSummary(); });
    const sourceLinks = $('source-links');
    Object.entries(catalog).forEach(([brand, item]) => { const p = document.createElement('p'); p.textContent = brand; sourceLinks.append(p); item.sources.forEach((url, index) => { const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = new URL(url).hostname + (index ? ' · ' + (index + 1) : ''); sourceLinks.append(a); }); });
    function istNow() { return new Date(Date.now() + 330 * 60000); }
    function isoIST() { return istNow().toISOString().slice(0, 10); }
    function dateLabel(value) { if (!value)
        return ''; return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(value + 'T12:00:00Z')); }
    function timeLabel(value) { const [h, m] = value.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; }
    let viewDate = new Date(isoIST() + 'T12:00:00Z');
    viewDate.setUTCDate(1);
    function renderCalendar() { const grid = $('calendar-grid'); grid.replaceChildren(); const year = viewDate.getUTCFullYear(), month = viewDate.getUTCMonth(); $('calendar-month').textContent = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(viewDate); const offset = (viewDate.getUTCDay() + 6) % 7; for (let i = 0; i < offset; i++) {
        const span = document.createElement('span');
        span.setAttribute('aria-hidden', 'true');
        grid.append(span);
    } const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate(); const today = isoIST(); for (let d = 1; d <= days; d++) {
        const value = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = d;
        button.dataset.date = value;
        button.setAttribute('aria-label', dateLabel(value));
        button.setAttribute('aria-pressed', String($('date').value === value));
        button.disabled = value < today;
        if (value === today) {
            button.classList.add('today');
            button.setAttribute('aria-current', 'date');
        }
        button.addEventListener('click', () => { $('date').value = value; $('date-caption').textContent = dateLabel(value); $('schedule-error').textContent = ''; renderCalendar(); refreshTimes(); updateSummary(); grid.querySelector(`[data-date="${value}"]`)?.focus(); });
        grid.append(button);
    } $('prev-month').disabled = viewDate.toISOString().slice(0, 7) <= today.slice(0, 7); const max = new Date(isoIST() + 'T12:00:00Z'); max.setUTCMonth(max.getUTCMonth() + 12); $('next-month').disabled = viewDate.toISOString().slice(0, 7) >= max.toISOString().slice(0, 7); }
    $('prev-month').addEventListener('click', () => { viewDate.setUTCMonth(viewDate.getUTCMonth() - 1); renderCalendar(); });
    $('next-month').addEventListener('click', () => { viewDate.setUTCMonth(viewDate.getUTCMonth() + 1); renderCalendar(); });
    for (let h = 9; h <= 20; h++)
        for (const m of [0, 30]) {
            if (h === 20 && m === 30)
                continue;
            const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            const label = document.createElement('label');
            label.className = 'time-option';
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'time';
            input.value = value;
            input.required = true;
            const span = document.createElement('span');
            span.textContent = timeLabel(value);
            label.append(input, span);
            $('time-grid').append(label);
        }
    function refreshTimes() { const now = istNow(); const current = now.toISOString().slice(11, 16); form.querySelectorAll('[name="time"]').forEach(input => { input.disabled = $('date').value === isoIST() && input.value <= current; if (input.disabled)
        input.checked = false; }); }
    renderCalendar();
    refreshTimes();
    const packageParam = new URLSearchParams(location.search).get('package');
    if (['Signature', 'Elite'].includes(packageParam))
        form.querySelector(`[name="collection"][value="${packageParam}"]`).checked = true;
    function selectedValue(field) { return fields[field].value === 'Other' ? $(`custom-${field}`).value : fields[field].value; }
    function updateSummary() { const model = selectedValue('model'); $('summary-car').textContent = [fields.brand.value, model].filter(Boolean).join(' · ') || 'Your next chapter'; $('summary-showroom').textContent = selectedValue('showroom') || 'Hyderabad'; const collection = form.querySelector('[name="collection"]:checked')?.value; $('summary-package').textContent = collection || 'Choose your experience'; $('summary-price').textContent = collection === 'Elite' ? '₹4,999' : collection === 'Signature' ? '₹2,999' : '—'; $('summary-date').textContent = dateLabel($('date').value) || 'A date to look forward to'; const time = form.querySelector('[name="time"]:checked')?.value; $('summary-time').textContent = time ? timeLabel(time) + ' IST' : 'To be selected'; }
    form.addEventListener('input', updateSummary);
    form.addEventListener('change', updateSummary);
    updateSummary();
    let currentStep = 0;
    function showStep(index) { currentStep = index; form.querySelectorAll('.flow-step').forEach((el, i) => el.hidden = i !== index); document.querySelectorAll('[data-indicator]').forEach((el, i) => { el.classList.toggle('active', i === index); el.classList.toggle('complete', i < index); }); const heading = form.querySelector(`[data-step="${index}"] h2`); heading.tabIndex = -1; heading.focus({ preventScroll: true }); form.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }
    function validStep(index) { const section = form.querySelector(`[data-step="${index}"]`); for (const input of section.querySelectorAll('input,select,textarea')) {
        if (input.type === 'hidden' || input.disabled || input.closest('[hidden]'))
            continue;
        if (!input.checkValidity()) {
            input.reportValidity();
            return false;
        }
    } if (index === 1) {
        const date = $('date').value, time = form.querySelector('[name="time"]:checked')?.value;
        if (!date || date < isoIST() || !time) {
            $('schedule-error').textContent = 'Choose your delivery date and a preferred time to continue.';
            return false;
        }
        if (new Date(`${date}T${time}:00+05:30`).getTime() <= Date.now()) {
            $('schedule-error').textContent = 'That time has passed. Please choose a later time.';
            refreshTimes();
            return false;
        }
    } return true; }
    form.querySelectorAll('.next-step').forEach(button => button.addEventListener('click', () => { if (validStep(currentStep))
        showStep(currentStep + 1); }));
    form.querySelectorAll('.back-step').forEach(button => button.addEventListener('click', () => showStep(currentStep - 1)));
    let confirmation;
    form.addEventListener('submit', async (e) => { e.preventDefault(); if (currentStep < 2) {
        if (validStep(currentStep))
            showStep(currentStep + 1);
        return;
    } for (let i = 0; i <= 2; i++)
        if (!validStep(i)) {
            showStep(i);
            return;
        } const payload = Object.fromEntries(new FormData(form)); payload.model = selectedValue('model'); payload.showroom = selectedValue('showroom'); delete payload.customModel; delete payload.customShowroom; const button = $('submit-booking'); button.disabled = true; button.textContent = 'Saving your booking…'; $('submit-error').textContent = ''; try {
        const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(payload))))).map(x => x.toString(16).padStart(2, '0')).join('');
        let key;
        try {
            key = sessionStorage.getItem('moto-request-' + hash);
            if (!key) {
                key = crypto.randomUUID();
                sessionStorage.setItem('moto-request-' + hash, key);
            }
        }
        catch {
            key = crypto.randomUUID();
        }
        const response = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key }, body: JSON.stringify(payload) });
        const result = await response.json();
        if (!response.ok)
            throw Error(result.error || 'Your booking could not be saved. Please try again.');
        confirmation = { ...payload, id: result.id, status: result.status };
        $('confirmation-id').textContent = result.id;
        $('booking-success').hidden = false;
        $('booking-success').focus();
        window.scrollTo({ top: 70, behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth' });
    }
    catch (error) {
        $('submit-error').textContent = error.message || 'We could not connect. Please try again; a retry will not duplicate a saved booking.';
    }
    finally {
        button.disabled = false;
        button.innerHTML = '<span class="book-now-label">Book Now</span><span class="book-now-arrow" aria-hidden="true">↗</span>';
    } });
})();

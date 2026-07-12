'use client';

import { useState } from 'react';
import { Event, AppData } from '../lib/types';
import { EventDraft } from '../components/EventModal';
import { apiFetch, ApiError } from '../app/lib/api-client';

export function useEventCRUD(
  data: AppData,
  setData: (d: AppData) => void,
  save: (next: AppData, msg?: string) => Promise<boolean>,
  setToast: (msg: string) => void,
  onAuthRequired: (op: () => void) => void
) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventDetailId, setEventDetailId] = useState<string | null>(null);
  const [eventModal, setEventModal] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [eventDraft, setEventDraft] = useState<EventDraft>({ date: new Date().toISOString().split('T')[0], title: '', desc: '', icon: 'heart', location: '', mood: '' });

  const selectedEvent = data.events.find(e => String(e.id) === selectedEventId) || null;
  const detailEvent = data.events.find(e => String(e.id) === eventDetailId) || null;
  const selectedPhotos = selectedEvent ? data.photos.filter(p => p.eventId === selectedEventId) : [];
  const selectedExpenses = selectedEvent ? data.expenses.filter(e => e.eventId === selectedEventId) : [];

  function openEventCreate() {
    setEditEvent(null);
    setEventDraft({ date: new Date().toISOString().split('T')[0], title: '', desc: '', icon: 'heart', location: '', mood: '' });
    setEventModal(true);
  }

  function openEventEdit(ev: Event) {
    setEditEvent(ev);
    setEventDraft({ date: ev.date, title: ev.title, desc: ev.desc, icon: ev.icon, location: ev.location, mood: ev.mood });
    setEventModal(true);
  }

  async function saveEvent() {
    if (!eventDraft.title || !eventDraft.date) { setToast('请填写标题和日期'); return; }

    if (editEvent) {
      const events = data.events.map(e => e.id === editEvent.id ? { ...e, ...eventDraft } : e);
      const sorted = events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEventModal(false); setEditEvent(null);
      await save({ ...data, events }, '已保存');
    } else {
      try {
        const { event: created } = await apiFetch<{ event: Event }>('/api/events', { method: 'POST', body: eventDraft });
        const events = [...data.events, created].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setEventModal(false);
        await save({ ...data, events }, '已创建');
        setSelectedEventId(String(created.id));
      } catch (err) {
        if (err instanceof ApiError && err.isAuthError) {
          onAuthRequired(() => saveEvent());
        } else {
          setToast('创建失败');
        }
      }
    }
  }

  async function deleteEvent() {
    if (!editEvent) return;
    try {
      await apiFetch(`/api/events/${editEvent.id}`, { method: 'DELETE' });
      const events = data.events.filter(e => e.id !== editEvent.id);
      const expenses = data.expenses.filter(e => e.eventId !== String(editEvent.id));
      setEventModal(false); setEditEvent(null);
      if (selectedEventId === String(editEvent.id)) setSelectedEventId(events.length > 0 ? String(events[0].id) : null);
      await save({ ...data, events, expenses }, '已删除');
    } catch (err) {
      if (err instanceof ApiError && err.isAuthError) {
        onAuthRequired(() => deleteEvent());
      } else {
        setToast('删除失败');
      }
    }
  }

  return {
    selectedEventId, setSelectedEventId,
    eventDetailId, setEventDetailId,
    eventModal, setEventModal,
    editEvent, setEditEvent,
    eventDraft, setEventDraft,
    selectedEvent, detailEvent, selectedPhotos, selectedExpenses,
    openEventCreate, openEventEdit, saveEvent, deleteEvent
  };
}

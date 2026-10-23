'use client';

import { useState } from 'react';
import { Event, AppData } from '../lib/types';
import { EventDraft } from '../components/EventModal';
import { apiFetch } from '../app/lib/api-client';
import type { MutateOptions } from './useAppData';

type Mutate = <T>(
  optimistic: (prev: AppData) => AppData,
  request: () => Promise<T>,
  opts?: MutateOptions<T>
) => Promise<T | null>;

function sortByDateDesc(events: Event[]): Event[] {
  return events.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function useEventCRUD(
  data: AppData,
  setData: (updater: (prev: AppData) => AppData) => void,
  mutate: Mutate,
  setToast: (msg: string) => void,
  onAuthRequired: (op: () => void | Promise<void>) => void
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
      /* 这里原来只有 setData，没有 PUT：改完看着像保存了，刷新就回原样 */
      const target = editEvent;
      const draft = eventDraft;
      const res = await mutate(
        prev => ({
          ...prev,
          events: sortByDateDesc(prev.events.map(e => (e.id === target.id ? { ...e, ...draft } : e)))
        }),
        () => apiFetch(`/api/events/${target.id}`, { method: 'PUT', body: draft }),
        { successMsg: '已保存', errorMsg: '保存失败', onAuthRequired }
      );
      if (res !== null) { setEventModal(false); setEditEvent(null); }
      return;
    }

    const res = await mutate<{ event: Event }>(
      prev => prev,
      () => apiFetch<{ event: Event }>('/api/events', { method: 'POST', body: eventDraft }),
      {
        successMsg: '已创建',
        errorMsg: '创建失败',
        onAuthRequired,
        onSuccess: ({ event }) => {
          setData(prev => ({ ...prev, events: sortByDateDesc([...prev.events, event]) }));
          setSelectedEventId(String(event.id));
        }
      }
    );

    if (res !== null) { setEventModal(false); setEditEvent(null); }
  }

  async function deleteEvent() {
    if (!editEvent) return;
    const target = editEvent;
    const res = await mutate(
      prev => ({
        ...prev,
        events: prev.events.filter(e => e.id !== target.id),
        expenses: prev.expenses.filter(e => e.eventId !== String(target.id)),
        /* 服务端是 SetNull：照片留下，只是脱离事件，不是一起删掉 */
        photos: prev.photos.map(p => (p.eventId === String(target.id) ? { ...p, eventId: null } : p))
      }),
      () => apiFetch(`/api/events/${target.id}`, { method: 'DELETE' }),
      { successMsg: '已删除', errorMsg: '删除失败', onAuthRequired }
    );

    if (res !== null) {
      const rest = data.events.filter(e => e.id !== target.id);
      setEventModal(false);
      setEditEvent(null);
      if (selectedEventId === String(target.id)) setSelectedEventId(rest.length > 0 ? String(rest[0].id) : null);
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

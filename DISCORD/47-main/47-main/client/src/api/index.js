// =====================================================================
//  API Client — Centralized fetch wrapper
// =====================================================================

const API_BASE = '/api';

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, config);

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return res.json();
}

// Auth
export const getMe = () => apiFetch('/auth/me');
export const logout = () => apiFetch('/auth/logout', { method: 'POST' });

// Guilds
export const getGuilds = () => apiFetch('/guilds');
export const getGuildInfo = (guildId) => apiFetch(`/guilds/${guildId}/info`);

// Channels
export const getChannels = (guildId) => apiFetch(`/channels/${guildId}`);

// Messages
export const sendMessage = (data) =>
  apiFetch('/messages/send', { method: 'POST', body: data });
export const sendEmbed = (data) =>
  apiFetch('/messages/send-embed', { method: 'POST', body: data });
export const getTemplates = (guildId) =>
  apiFetch(`/messages/templates/${guildId}`);
export const saveTemplate = (data) =>
  apiFetch('/messages/templates', { method: 'POST', body: data });
export const deleteTemplate = (id) =>
  apiFetch(`/messages/templates/${id}`, { method: 'DELETE' });

// Giveaways
export const getGiveaways = (guildId) => apiFetch(`/giveaways/${guildId}`);
export const createGiveaway = (data) =>
  apiFetch('/giveaways/create', { method: 'POST', body: data });
export const endGiveaway = (id) =>
  apiFetch(`/giveaways/${id}/end`, { method: 'POST' });

// Members
export const getMembers = (guildId, search = '') =>
  apiFetch(`/members/${guildId}?search=${encodeURIComponent(search)}`);
export const kickMember = (guildId, data) =>
  apiFetch(`/members/${guildId}/kick`, { method: 'POST', body: data });
export const banMember = (guildId, data) =>
  apiFetch(`/members/${guildId}/ban`, { method: 'POST', body: data });
export const updateMemberRole = (guildId, data) =>
  apiFetch(`/members/${guildId}/role`, { method: 'POST', body: data });

// Roles
export const getRoles = (guildId) => apiFetch(`/roles/${guildId}`);
export const createRole = (guildId, data) =>
  apiFetch(`/roles/${guildId}/create`, { method: 'POST', body: data });
export const editRole = (guildId, roleId, data) =>
  apiFetch(`/roles/${guildId}/${roleId}`, { method: 'PUT', body: data });
export const getAutoRole = (guildId) => apiFetch(`/roles/${guildId}/autorole`);
export const updateAutoRole = (guildId, data) =>
  apiFetch(`/roles/${guildId}/autorole`, { method: 'PUT', body: data });

// Logs
export const getLogs = (guildId, page = 1) =>
  apiFetch(`/logs/${guildId}?page=${page}`);

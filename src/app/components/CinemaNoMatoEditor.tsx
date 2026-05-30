import { useState, useEffect } from "react";
import {
  Film, Save, Plus, Pencil, Trash2, Eye, EyeOff,
  Calendar as CalendarIcon, Image as ImageIcon, DollarSign,
  FileText, ChevronDown, ChevronUp, GripVertical,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "./ui/dialog";
import { ImageSelector } from "./ImageSelector";
import { toast } from "sonner";
import {
  loadComprehensiveContent,
  saveComprehensiveContentAsync,
} from "../lib/comprehensiveContent";

// ── types ─────────────────────────────────────────────────────
interface CinemaSession {
  id:        string;
  date:      string;
  display:   string;
  day:       string;
  month:     string;
  weekday:   string;
  time:      string;
  film:      string;
  synopsis:  string;
  filmImage: string;
  venue:     string;
  seats:     number;
  published: boolean;
}

interface IncludeItem { icon: string; title: string; desc: string; }
interface FaqItem     { q: string; a: string; }

interface CinemaData {
  hero:     { image: string; tagline: string; prodLine: string; };
  about:    { body1: string; body2: string; };
  pricing:  { adultPrice: number; childPrice: number; childAgeLabel: string; };
  sessions: CinemaSession[];
  includes: IncludeItem[];
  faq:      FaqItem[];
  footer:   { brandSub: string; newsletterText: string; };
}

// ── date helpers ──────────────────────────────────────────────
const PT_MONTHS       = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const PT_MONTHS_SHORT = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
const PT_WEEKDAYS     = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];

function dateFields(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return {
    day:     String(d.getDate()),
    month:   PT_MONTHS_SHORT[d.getMonth()],
    weekday: PT_WEEKDAYS[d.getDay()],
    display: `${d.getDate()} de ${PT_MONTHS[d.getMonth()]} de ${d.getFullYear()}`,
  };
}

function newId() { return 'cnm-' + Date.now(); }

const BLANK_SESSION: Omit<CinemaSession, 'id'> = {
  date: '', display: '', day: '', month: '', weekday: '',
  time: '21:00', film: '', synopsis: '', filmImage: '', venue: 'Quinta da Floresta, Sintra',
  seats: 50, published: true,
};

const DEFAULT: CinemaData = {
  hero:    { image: '', tagline: 'Cinema ao ar livre · Jantar incluído · Sintra', prodLine: 'Uma produção Hop On Sintra & A do Mato' },
  about:   { body1: '', body2: '' },
  pricing: { adultPrice: 35, childPrice: 20, childAgeLabel: '6–12 anos' },
  sessions: [],
  includes: [],
  faq:      [],
  footer:   { brandSub: '', newsletterText: '' },
};

// ── main component ────────────────────────────────────────────
type Section = 'sessions' | 'hero' | 'pricing' | 'copy';

export function CinemaNoMatoEditor() {
  const [data,       setData]       = useState<CinemaData>(DEFAULT);
  const [section,    setSection]    = useState<Section>('sessions');
  const [saving,     setSaving]     = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Session dialog
  const [dialogOpen,      setDialogOpen]      = useState(false);
  const [editingSession,  setEditingSession]  = useState<CinemaSession | null>(null);
  const [sessionDraft,    setSessionDraft]    = useState<CinemaSession>({ id: '', ...BLANK_SESSION });

  useEffect(() => {
    const content = loadComprehensiveContent();
    if (content.cinemaNoMato) {
      setData({ ...DEFAULT, ...content.cinemaNoMato } as CinemaData);
    }
  }, []);

  function patch(updater: (prev: CinemaData) => CinemaData) {
    setData(updater);
    setHasChanges(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const content = loadComprehensiveContent();
      const result = await saveComprehensiveContentAsync({ ...content, cinemaNoMato: data });
      if (result.success) { toast.success('Cinema no Mato guardado!'); setHasChanges(false); }
      else toast.error('Erro ao guardar — ' + (result.error ?? 'unknown'));
    } catch { toast.error('Erro ao guardar'); }
    finally { setSaving(false); }
  }

  // ── Session helpers ────────────────────────────────────────
  function openAdd() {
    setEditingSession(null);
    setSessionDraft({ id: newId(), ...BLANK_SESSION });
    setDialogOpen(true);
  }

  function openEdit(s: CinemaSession) {
    setEditingSession(s);
    setSessionDraft({ ...s });
    setDialogOpen(true);
  }

  function patchDraft(field: keyof CinemaSession, val: string | number | boolean) {
    setSessionDraft(prev => {
      const next = { ...prev, [field]: val };
      if (field === 'date' && typeof val === 'string' && val) {
        Object.assign(next, dateFields(val));
      }
      return next;
    });
  }

  function saveSession() {
    if (!sessionDraft.date) { toast.error('Seleciona uma data'); return; }
    if (!sessionDraft.venue.trim()) { toast.error('Insere o local'); return; }
    patch(prev => {
      const sessions = editingSession
        ? prev.sessions.map(s => s.id === editingSession.id ? sessionDraft : s)
        : [...prev.sessions, sessionDraft].sort((a, b) => a.date.localeCompare(b.date));
      return { ...prev, sessions };
    });
    setDialogOpen(false);
    toast.success(editingSession ? 'Sessão actualizada' : 'Sessão adicionada');
  }

  function deleteSession(id: string) {
    if (!confirm('Tens a certeza que queres eliminar esta sessão?')) return;
    patch(prev => ({ ...prev, sessions: prev.sessions.filter(s => s.id !== id) }));
  }

  function togglePublished(id: string) {
    patch(prev => ({
      ...prev,
      sessions: prev.sessions.map(s => s.id === id ? { ...s, published: !s.published } : s),
    }));
  }

  // ── FAQ helpers ───────────────────────────────────────────
  function addFaq()       { patch(p => ({ ...p, faq: [...p.faq, { q: '', a: '' }] })); }
  function deleteFaq(i: number) { patch(p => ({ ...p, faq: p.faq.filter((_, j) => j !== i) })); }
  function patchFaq(i: number, field: 'q' | 'a', val: string) {
    patch(p => { const faq = [...p.faq]; faq[i] = { ...faq[i], [field]: val }; return { ...p, faq }; });
  }

  // ── Includes helpers ──────────────────────────────────────
  function addInclude()        { patch(p => ({ ...p, includes: [...p.includes, { icon: '✨', title: '', desc: '' }] })); }
  function deleteInclude(i: number) { patch(p => ({ ...p, includes: p.includes.filter((_, j) => j !== i) })); }
  function patchInclude(i: number, field: keyof IncludeItem, val: string) {
    patch(p => { const includes = [...p.includes]; includes[i] = { ...includes[i], [field]: val }; return { ...p, includes }; });
  }

  // ── render ─────────────────────────────────────────────────
  const sectionBtns: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'sessions', label: 'Sessões',  icon: <CalendarIcon className="h-4 w-4" /> },
    { id: 'hero',     label: 'Hero',     icon: <ImageIcon className="h-4 w-4" /> },
    { id: 'pricing',  label: 'Preços',   icon: <DollarSign className="h-4 w-4" /> },
    { id: 'copy',     label: 'Conteúdo', icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Film className="h-5 w-5 text-primary" />
            Cinema no Mato
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gere sessões, preços, imagens e texto do site cinemánomato.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || !hasChanges} className="shrink-0">
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'A guardar…' : 'Guardar'}
        </Button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 flex-wrap border-b border-border pb-1">
        {sectionBtns.map(btn => (
          <button
            key={btn.id}
            onClick={() => setSection(btn.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-t text-sm font-medium transition-colors
              ${section === btn.id
                ? 'bg-background border border-b-background border-border text-foreground -mb-px'
                : 'text-muted-foreground hover:text-foreground'}`}
          >
            {btn.icon}{btn.label}
          </button>
        ))}
      </div>

      {/* ── SESSIONS ───────────────────────────────────────── */}
      {section === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {data.sessions.length} sessão{data.sessions.length !== 1 ? 'ões' : ''} configurada{data.sessions.length !== 1 ? 's' : ''}
            </p>
            <Button onClick={openAdd} size="sm">
              <Plus className="mr-1.5 h-4 w-4" /> Nova Sessão
            </Button>
          </div>

          {data.sessions.length === 0 ? (
            <Card className="py-12 text-center text-muted-foreground text-sm">
              <Film className="mx-auto mb-3 h-8 w-8 opacity-30" />
              Sem sessões. Clica em «Nova Sessão» para adicionar.
            </Card>
          ) : (
            <div className="space-y-3">
              {data.sessions.map(s => (
                <Card key={s.id} className={`overflow-hidden transition-opacity ${!s.published ? 'opacity-60' : ''}`}>
                  <div className="flex gap-4 p-4">
                    {/* Film image or placeholder */}
                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary/50 flex items-center justify-center">
                      {s.filmImage
                        ? <img src={s.filmImage} alt={s.film} className="h-full w-full object-cover" />
                        : <Film className="h-6 w-6 text-muted-foreground/40" />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-foreground">
                          {s.weekday}, {s.display}
                        </span>
                        <Badge variant={s.published ? 'default' : 'outline'} className="text-xs">
                          {s.published ? 'Publicada' : 'Rascunho'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        🕘 {s.time}h &nbsp;·&nbsp; 📍 {s.venue}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        🎬 {s.film || <span className="italic opacity-60">Filme a anunciar</span>}
                        &nbsp;·&nbsp; {s.seats} lugares
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8"
                        title={s.published ? 'Despublicar' : 'Publicar'}
                        onClick={() => togglePublished(s.id)}
                      >
                        {s.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteSession(s.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── HERO ───────────────────────────────────────────── */}
      {section === 'hero' && (
        <div className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Imagem de fundo</CardTitle>
              <CardDescription>Aparece como fundo do ecrã de abertura.</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageSelector
                label=""
                value={data.hero.image}
                onChange={url => patch(p => ({ ...p, hero: { ...p.hero, image: url } }))}
              />
            </CardContent>
          </Card>

        </div>
      )}

      {/* ── PRICING ────────────────────────────────────────── */}
      {section === 'pricing' && (
        <div className="space-y-4 max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preços dos Bilhetes</CardTitle>
              <CardDescription>O jantar está sempre incluído em ambas as categorias.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Adulto (€)</Label>
                  <Input
                    type="number" min={0} step={1}
                    value={data.pricing.adultPrice}
                    onChange={e => patch(p => ({ ...p, pricing: { ...p.pricing, adultPrice: Number(e.target.value) } }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Criança (€)</Label>
                  <Input
                    type="number" min={0} step={1}
                    value={data.pricing.childPrice}
                    onChange={e => patch(p => ({ ...p, pricing: { ...p.pricing, childPrice: Number(e.target.value) } }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Faixa etária crianças</Label>
                <Input
                  value={data.pricing.childAgeLabel}
                  onChange={e => patch(p => ({ ...p, pricing: { ...p.pricing, childAgeLabel: e.target.value } }))}
                  placeholder="6–12 anos"
                />
                <p className="text-xs text-muted-foreground">Aparece ao lado de "Crianças" na modal de compra.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200/40 bg-amber-50/20">
            <CardContent className="pt-4">
              <p className="text-sm font-semibold text-foreground mb-1">Resumo actual</p>
              <p className="text-sm text-muted-foreground">
                Adulto — <strong className="text-foreground">€{data.pricing.adultPrice}</strong> · Jantar incl.
              </p>
              <p className="text-sm text-muted-foreground">
                Criança ({data.pricing.childAgeLabel}) — <strong className="text-foreground">€{data.pricing.childPrice}</strong> · Jantar incl.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── COPY ───────────────────────────────────────────── */}
      {section === 'copy' && (
        <div className="space-y-6">

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Secção «Sobre»</CardTitle>
              <CardDescription>Dois parágrafos da descrição do evento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Parágrafo 1</Label>
                <Textarea
                  rows={3}
                  value={data.about.body1}
                  onChange={e => patch(p => ({ ...p, about: { ...p.about, body1: e.target.value } }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Parágrafo 2</Label>
                <Textarea
                  rows={3}
                  value={data.about.body2}
                  onChange={e => patch(p => ({ ...p, about: { ...p.about, body2: e.target.value } }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Includes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">O que está incluído</CardTitle>
                <CardDescription>Cards com ícone, título e descrição.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={addInclude}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.includes.map((inc, i) => (
                <div key={i} className="flex gap-2 items-start p-3 rounded-lg border border-border bg-secondary/20">
                  <Input
                    className="w-14 text-center text-base px-1"
                    value={inc.icon} placeholder="🎬"
                    onChange={e => patchInclude(i, 'icon', e.target.value)}
                  />
                  <div className="flex-1 space-y-2">
                    <Input value={inc.title} placeholder="Título" onChange={e => patchInclude(i, 'title', e.target.value)} />
                    <Input value={inc.desc}  placeholder="Descrição" onChange={e => patchInclude(i, 'desc',  e.target.value)} />
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 shrink-0" onClick={() => deleteInclude(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">FAQ</CardTitle>
                <CardDescription>Perguntas e respostas frequentes.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={addFaq}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.faq.map((item, i) => (
                <div key={i} className="space-y-2 p-3 rounded-lg border border-border bg-secondary/20">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">P{i + 1}</span>
                    <Input value={item.q} placeholder="Pergunta" onChange={e => patchFaq(i, 'q', e.target.value)} />
                    <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 shrink-0" onClick={() => deleteFaq(i)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Textarea
                    rows={2} className="ml-7"
                    value={item.a} placeholder="Resposta"
                    onChange={e => patchFaq(i, 'a', e.target.value)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Footer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rodapé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Texto sob o logótipo</Label>
                <Textarea
                  rows={2}
                  value={data.footer.brandSub}
                  onChange={e => patch(p => ({ ...p, footer: { ...p.footer, brandSub: e.target.value } }))}
                  placeholder="Uma produção Hop On Sintra & A do Mato&#10;Sintra, Portugal"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Texto da newsletter</Label>
                <Input
                  value={data.footer.newsletterText}
                  onChange={e => patch(p => ({ ...p, footer: { ...p.footer, newsletterText: e.target.value } }))}
                  placeholder="Avisamos quando há nova sessão. Sem spam, prometemos."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sticky save bar */}
      {hasChanges && (
        <div className="sticky bottom-4 flex justify-end">
          <div className="flex items-center gap-3 rounded-xl border bg-background px-4 py-3 shadow-lg">
            <span className="text-sm text-muted-foreground">Alterações não guardadas</span>
            <Button onClick={handleSave} disabled={saving} size="sm">
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'A guardar…' : 'Guardar alterações'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Session add/edit dialog ──────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSession ? 'Editar Sessão' : 'Nova Sessão'}</DialogTitle>
            <DialogDescription>Preenche os detalhes da sessão de cinema.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={sessionDraft.date}
                  onChange={e => patchDraft('date', e.target.value)}
                />
                {sessionDraft.weekday && (
                  <p className="text-xs text-muted-foreground">{sessionDraft.weekday}, {sessionDraft.display}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Hora</Label>
                <Input
                  value={sessionDraft.time}
                  onChange={e => patchDraft('time', e.target.value)}
                  placeholder="21:00"
                />
              </div>
            </div>

            {/* Film */}
            <div className="space-y-1.5">
              <Label>Título do Filme</Label>
              <Input
                value={sessionDraft.film}
                onChange={e => patchDraft('film', e.target.value)}
                placeholder="Deixa em branco para «A anunciar»"
              />
            </div>

            {/* Synopsis */}
            <div className="space-y-1.5">
              <Label>Sinopse</Label>
              <Textarea
                rows={3}
                value={sessionDraft.synopsis}
                onChange={e => patchDraft('synopsis', e.target.value)}
                placeholder="Breve descrição do filme — aparece na modal de compra."
              />
            </div>

            {/* Film image */}
            <div className="space-y-1.5">
              <Label>Imagem do Filme / Poster</Label>
              <p className="text-xs text-muted-foreground">Aparece no card da sessão.</p>
              <ImageSelector
                label=""
                value={sessionDraft.filmImage}
                onChange={url => patchDraft('filmImage', url)}
              />
            </div>

            {/* Venue */}
            <div className="space-y-1.5">
              <Label>Local *</Label>
              <Input
                value={sessionDraft.venue}
                onChange={e => patchDraft('venue', e.target.value)}
                placeholder="Quinta da Floresta, Sintra"
              />
            </div>

            {/* Seats */}
            <div className="space-y-1.5">
              <Label>Lugares disponíveis</Label>
              <Input
                type="number" min={0} max={500}
                value={sessionDraft.seats}
                onChange={e => patchDraft('seats', Number(e.target.value))}
              />
            </div>

            {/* Published toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Publicada</p>
                <p className="text-xs text-muted-foreground">Sessões não publicadas ficam ocultas no site.</p>
              </div>
              <Switch
                checked={sessionDraft.published}
                onCheckedChange={v => patchDraft('published', v)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveSession}>
              {editingSession ? 'Guardar alterações' : 'Adicionar sessão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

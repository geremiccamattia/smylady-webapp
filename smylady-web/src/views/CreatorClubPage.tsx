'use client'

import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { Crown, TrendingUp, Sparkles, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useLocalePath } from '@/hooks/useLocalePath'
import { cn } from '@/lib/utils'

/*
 * Landingpage des Creator Clubs.
 *
 * Das Bewerbungsformular steckte bis zuletzt direkt in dieser Datei. Es ist
 * jetzt eine eigene Komponente (components/creator/CreatorApplicationForm.tsx)
 * und läuft nur noch eingeloggt — entweder als Zusatzschritt der Registrierung
 * oder auf /creator/apply. Der Grund ist nicht die Seitenstruktur, sondern das
 * Backend: Die Bewerbung wird serverseitig mit der userId verknüpft, wofür ein
 * Token nötig ist.
 *
 * Geblieben sind Hero, Benefits, Story und die Abschlusszeile. An ihre Stelle
 * tritt ein CTA-Block, der je nach Anmeldestatus verzweigt.
 */

const GRADIENT = 'bg-gradient-to-r from-[#ff720e] via-[#ff4d3c] to-[#e9548c]'

export default function CreatorClubPage() {
  const { t } = useTranslation()
  const localePath = useLocalePath()
  const { isAuthenticated } = useAuth()

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  /*
   * Ohne Konto führt der Weg über die Registrierung, die mit ?creator=1 die
   * Creator-Checkbox vorbelegt. Mit Konto direkt zum Formular.
   */
  const applyHref = isAuthenticated
    ? localePath('/creator/apply')
    : localePath('/register?creator=1')

  return (
    <div className="max-w-[1200px] mx-auto pb-24 md:pb-0">
      {/* Hero */}
      <section className="grid md:grid-cols-[0.86fr_1.14fr] gap-10 items-center py-6 md:py-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold leading-[1.05] tracking-tight">
            <span className="block">
              {t('influencer.heroHeadline1', { defaultValue: 'Create moments.' })}
            </span>
            <span className="block">
              {t('influencer.heroHeadline3', { defaultValue: 'Share Your Party.' })}
            </span>
            <span className={cn(GRADIENT, 'block bg-clip-text text-transparent')}>
              {t('influencer.heroHeadline4', { defaultValue: 'Creator Club.' })}
            </span>
          </h1>
          <div className={cn('w-14 h-0.5 my-6', GRADIENT)} />
          <p className="text-muted-foreground text-base leading-relaxed max-w-md">
            {t('influencer.heroLead', {
              defaultValue:
                'Werde Teil des Share Your Party Creator Clubs. Erlebe exklusive Events, teile echte Momente und wachse gemeinsam mit einer aktiven Community.',
            })}
          </p>
          <div className="flex items-center gap-8 mt-8 flex-wrap">
            {/* Zielt wie bisher auf den Anker, der jetzt den CTA-Block trägt. */}
            <Button
              size="xl"
              className={cn('rounded-full text-white hover:opacity-90 uppercase text-xs font-black tracking-wide', GRADIENT)}
              onClick={() => scrollTo('bewerbung')}
            >
              {t('influencer.ctaApply', { defaultValue: 'Jetzt bewerben' })} →
            </Button>
            <button
              type="button"
              onClick={() => scrollTo('vorteile')}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-wide hover:text-[#e9548c] transition-colors"
            >
              {t('influencer.ctaLearnMore', { defaultValue: 'Mehr erfahren' })} ↓
            </button>
          </div>
        </div>

        <div className="relative min-h-[380px] md:min-h-[500px]">
          <div
            className="absolute inset-x-2 inset-y-2 md:inset-2 overflow-hidden bg-muted"
            style={{
              clipPath:
                "path('M 122 40 C 218 4, 373 2, 462 73 C 544 139, 548 318, 477 402 C 408 484, 265 504, 157 458 C 49 411, 1 319, 23 219 C 39 144, 57 67, 122 40 Z')",
              borderRadius: '40% 55% 45% 55% / 48% 42% 58% 52%',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/influencer/creator-neu.jpeg" alt="" className="w-full h-full object-cover" />
          </div>
          <div
            className={cn('hidden md:block absolute w-44 h-48 -right-3 bottom-6 opacity-80', GRADIENT)}
            style={{ borderRadius: '44% 56% 60% 40% / 42% 47% 53% 58%' }}
          />
          <div className="absolute left-2 md:left-8 bottom-0 flex items-center gap-3 bg-white rounded-full shadow-lg px-5 py-3 min-w-[240px]">
            <div className="flex">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    'w-9 h-9 rounded-full border-2 border-white bg-gradient-to-br from-[#3b1a15] to-[#f4a366]',
                    i > 0 && '-ml-2'
                  )}
                />
              ))}
            </div>
            <div>
              <strong className="block text-[#e9548c] text-lg leading-none">+350</strong>
              <small className="text-[9px] uppercase tracking-wide text-muted-foreground">
                {t('influencer.activeCreators', { defaultValue: 'Aktive Creator' })}
              </small>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section
        id="vorteile"
        className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4 md:gap-x-0 md:divide-x divide-border mt-6 p-6 md:p-9 rounded-2xl bg-white shadow-lg scroll-mt-20"
      >
        {[
          { icon: Sparkles, color: '#e9548c', titleKey: 'influencer.benefitsTitle1', descKey: 'influencer.benefitsDesc1', titleDefault: 'Exklusive Events', descDefault: 'Zugang zu den besten Partys & Events in Wien.' },
          { icon: Crown, color: '#ff720e', titleKey: 'influencer.benefitsTitle2', descKey: 'influencer.benefitsDesc2', titleDefault: 'VIP Access', descDefault: 'VIP-Zugang, besondere Goodies und mehr.' },
          { icon: TrendingUp, color: '#ffb800', titleKey: 'influencer.benefitsTitle3', descKey: 'influencer.benefitsDesc3', titleDefault: 'Wachsen & verdienen', descDefault: 'Kooperationen, Affiliate-Programme und faire Vergütungen.' },
          { icon: Users, color: '#6f35ff', titleKey: 'influencer.benefitsTitle4', descKey: 'influencer.benefitsDesc4', titleDefault: 'Community & Support', descDefault: 'Werde Teil einer aktiven Creator Community mit echtem Support.' },
        ].map((benefit) => (
          <article key={benefit.titleKey} className="text-center px-2 md:px-6">
            <benefit.icon className="mx-auto h-9 w-9" style={{ color: benefit.color }} strokeWidth={1.5} />
            <h2 className="mt-4 mb-3 text-[13px] font-bold uppercase tracking-wide">
              {t(benefit.titleKey, { defaultValue: benefit.titleDefault })}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t(benefit.descKey, { defaultValue: benefit.descDefault })}
            </p>
          </article>
        ))}
      </section>

      {/* Story */}
      <section className="grid md:grid-cols-[0.72fr_1.28fr] gap-10 items-center py-16 px-2">
        <div className="text-center md:text-left">
          <p className="mb-2 text-[13px] font-black uppercase tracking-wide text-[#e9548c]">
            {t('influencer.storyEyebrow', { defaultValue: 'Deine Story.' })}
          </p>
          <h2 className="text-3xl md:text-[44px] font-black leading-[1.08] tracking-tight">
            {t('influencer.storyHeadline1', { defaultValue: 'Deine Bühne.' })}
            <br />
            <span className={cn(GRADIENT, 'bg-clip-text text-transparent')}>
              {t('influencer.storyHeadline2', { defaultValue: 'Deine Community.' })}
            </span>
          </h2>
          <div className={cn('w-14 h-0.5 my-6 mx-auto md:mx-0', GRADIENT)} />
          <p className="text-[#55555b] text-sm leading-relaxed max-w-sm mx-auto md:mx-0">
            {t('influencer.storyLead', {
              defaultValue:
                'Wir bringen Creator mit den besten Events, Brands und Menschen zusammen. Für unvergessliche Momente und echten Impact.',
            })}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 md:gap-5">
          {[
            { src: '/images/influencer/story-1.jpg', rotate: '-rotate-[4deg]', titleKey: 'influencer.story1Title', titleDefault: 'Backstage pass unlocked' },
            { src: '/images/influencer/story-2.jpg', rotate: '', titleKey: 'influencer.story2Title', titleDefault: 'Best night in Vienna! 🔥' },
            { src: '/images/influencer/story-3.jpg', rotate: 'rotate-[4deg]', titleKey: 'influencer.story3Title', titleDefault: 'Moments that matter' },
          ].map((card) => (
            <article
              key={card.titleKey}
              className={cn(
                'relative w-[30%] md:w-[190px] h-[220px] md:h-[305px] rounded-xl md:rounded-2xl overflow-hidden bg-black shadow-xl shrink-0',
                card.rotate
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.src} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 p-3 md:p-5 flex flex-col justify-end text-white bg-gradient-to-t from-black/80 via-black/10 to-transparent">
                <strong className="text-sm md:text-xl leading-tight">
                  {t(card.titleKey, { defaultValue: card.titleDefault })}
                </strong>
                <small className="mt-2 md:mt-4 text-[8px] md:text-[9px]">@shareyourparty</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/*
        * CTA statt Formular.
        *
        * Die id bleibt 'bewerbung': Der Hero-Button und etwaige externe Links
        * springen weiterhin hierher, nur steht hier jetzt der Absprung statt
        * des Formulars.
        */}
      <section
        id="bewerbung"
        className="flex flex-col md:flex-row rounded-3xl bg-white shadow-lg scroll-mt-20 overflow-hidden"
      >
        <div className="relative hidden md:block md:w-[230px] md:shrink-0 overflow-hidden bg-[#fff2ed]">
          <div className={cn('absolute w-40 h-40 -left-16 -bottom-14 rounded-full opacity-65', GRADIENT)} />
          <div className={cn('absolute w-24 h-24 -right-8 -bottom-6 rounded-full opacity-65', GRADIENT)} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/influencer/hero-neu.jpeg" alt="" className="relative z-10 w-full h-full object-cover" />
        </div>

        <div className="flex-1 p-8 md:p-10 flex flex-col justify-center text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-3">
            {t('influencer.ctaBlockTitle', { defaultValue: 'Bereit für den Creator Club?' })}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto md:mx-0 mb-6">
            {isAuthenticated
              ? t('influencer.ctaBlockBodyLoggedIn', {
                  defaultValue:
                    'Erzähl uns von deinen Kanälen und deinen Themen. Die Bewerbung dauert nur wenige Minuten.',
                })
              : t('influencer.ctaBlockBody', {
                  defaultValue:
                    'Leg dir ein kostenloses Konto an und bewirb dich direkt dabei. Die Bewerbung dauert nur wenige Minuten.',
                })}
          </p>
          <div>
            <Link href={applyHref}>
              <Button
                size="xl"
                className={cn(
                  'rounded-full text-white hover:opacity-90 uppercase text-xs font-black tracking-wide',
                  GRADIENT
                )}
              >
                {t('influencer.ctaApply', { defaultValue: 'Jetzt bewerben' })} →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/*
        * Abzweig für Marken.
        *
        * Bewusst nur ein Satz unterhalb des CTA-Blocks: Wer hier gelandet ist,
        * aber eine Marke vertritt, findet so den richtigen Weg.
        */}
      <p className="text-center mt-10 text-sm text-muted-foreground">
        {t('influencer.brandHint', { defaultValue: 'Du bist eine Marke statt Creator?' })}{' '}
        <Link href={localePath('/register/brand')} className="text-primary hover:underline font-medium">
          {t('influencer.brandHintLink', { defaultValue: 'Hier geht es zur Markenregistrierung' })}
        </Link>
      </p>

      {/* Closing */}
      <p className="text-center mt-14 mb-1 text-xs tracking-[0.4em] uppercase text-muted-foreground">
        {t('influencer.closingLine', { defaultValue: 'Be part of something real.' })}
      </p>
      <div className="text-center text-[#e9548c] text-2xl mb-8">♡</div>
    </div>
  )
}

import { Link, redirect, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { useTranslations } from "next-intl";
import Image from "next/image";

function GymEmbraceMention() {
  return <span className="font-bold">GymEmbrace</span>;
}

function Testimony({
  imagePath,
  name,
  description,
  className,
  children,
}: {
  imagePath: string;
  name: string;
  className?: string;
  description: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        "carousel-item max-w-sm flex flex-col gap-4 p-4 rounded-3xl shadow-xl hover:scale-105 transition-transform " +
        (className ?? "")
      }
    >
      <div className="flex gap-4 items-center">
        <div className="avatar">
          <div className="w-16 h-16 rounded-full">
            <Image width="668" height="674" src={imagePath} alt={name} />
          </div>
        </div>

        <div>
          <h2 className="font-bold text-xl">{name}</h2>
          <p className="text-xs">— {description}</p>
        </div>
      </div>

      <div className="p-2 text-2sm">{children}</div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <main className="flex flex-col items-center">
      <section
        className="hero min-h-screen"
        style={{
          backgroundImage: 'url("/images/hero-1.jpg")',
        }}
      >
        <div className="hero-overlay w-full h-full"></div>
        <div className="hero-content text-neutral-content text-center backdrop-brightness-75 backdrop-blur-xs rounded-4xl">
          <div className="max-w-2xl">
            <div className="mb-5 text-4xl font-bold">
              Start Your Fitness Journey Today
            </div>
            <p className="mb-5">
              Discover a gym designed around your goals. Whether you{"'"}re
              building strength, improving your health, or simply looking for a
              place that keeps you motivated, our coaches, classes, and
              state-of-the-art equipment are here to support you every step of
              the way. Join a community that celebrates progress, encourages
              consistency, and believes in your potential.
            </p>
            <Link href="/auth/register" className="btn btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      <section className="flex flex-col m-4 px-8 py-20 max-w-[min(100vw,90rem)]">
        <div className="mt-4">
          <h1 className="text-3xl font-bold space-y-0.5 max-w-3xl text-base-content">
            What Our Members Say
          </h1>
          <p className="text-base-content/70">
            Real experiences from people who’ve trained, grown, and transformed
            with us.
          </p>
        </div>
        <div className="carousel gap-4 p-4 m-4">
          <Testimony
            className="bg-primary text-primary-content"
            name="Lamine Yamal"
            imagePath="/images/customer-1.jpg"
            description={
              <>
                Professional footballer at{" "}
                <Link
                  className="link"
                  target="_blank"
                  href="https://bluelock.fandom.com/wiki/FC_Barcha"
                >
                  FC Barcha
                </Link>
              </>
            }
          >
            Before joining <GymEmbraceMention />, I was constantly mogged by
            this turtle-faced rival flexing his "15 elite trophies." But since I
            started lifting, I’ve bullied him four times straight, snatching the
            domestic crown while he bottled his big performance abroad. The
            confidence boost is wild; I’ve even reached level 100 rizzler status
            with queens like Fati V. Sure, he recently out-lifted me—even though
            I paid the "officials" for a spot—but watching him fail a set
            against average guys from Vigo proves I’m still sitting comfortably
            at the top of the table.
          </Testimony>
          <Testimony
            className="bg-info text-info-content"
            name="Sean John Combs"
            imagePath="/images/customer-2.jpg"
            description={<> World Famous Rapper </>}
          >
            Training with young Lamine is different. He really helped me
            appreciate the sophisticated touch of a much "mature" spotter. In
            return, I taught him that friction is the enemy—you can never have
            too much baby oil on hand for those marathon sessions. People ask
            why I need a warehouse full of it for "recovery," but Lamine gets it
            now. We’re just two slippery icons gliding to the top, and{" "}
            <GymEmbraceMention /> is the perfect place to do so.
          </Testimony>
          <Testimony
            className="bg-accent text-accent-content"
            name="Alice"
            imagePath="/images/customer-3.jpg"
            description={<> Final Survivor of Nuclear Winter Earth </>}
          >
            The functional strength I built at <GymEmbraceMention /> is the only
            reason my circuits haven't frozen over in this nuclear hellscape.
            Digging for supplies is basically just an endless, lonely deadlift
            session now. I miss spotting my Master, though I suspect this gym
            branch has been rubble for centuries. Wait... is that a USB drive
            buried in the snow? I'm going to check it out—hope it's a new
            workout plan and not a goodbye letter.
          </Testimony>
          <Testimony
            className="bg-secondary text-secondary-content"
            name="S. Fubuki"
            imagePath="/images/customer-4.jpg"
            description={<> Professional ship captain (not the VTuber) </>}
          >
            My crew calls it "sea madness," but I call it elite mental
            conditioning. <GymEmbraceMention /> gave me the back strength to
            hoist the main sail solo after my first voyage failed disastrously.
            I’m currently stuck on a plateau waiting for the "right wind," just
            staring at the Northern horizon between sets. People say the girl
            I’m training to meet is just a hallucination from dehydration, but
            once I hit this final PR, I’ll row past the edge of the world where
            no one can hurt us anymore.
          </Testimony>
        </div>
      </section>

      <section className="hero min-h-screen">
        <div className="hero-content flex-col lg:flex-row md:gap-8 lg:gap-16 xl:gap-32">
          <Image
            width={687}
            height={1024}
            src="/images/hero-2.jpg"
            alt="Coach Charlie Kirk"
            className="max-w-sm rounded-lg shadow-2xl"
          />
          <div className="flex flex-col gap-8">
            <h2 className="text-3xl lg:text-5xl font-bold">
              Everything You Need To Stay Consistent
            </h2>
            <p className="text-xl text-base-content/50">
              From equipment to coaching, every detail is designed to help you
              train better, feel stronger, and stay motivated week after week.
              Whether you're just starting or pushing for the next level, we've
              built an environment that keeps you showing up.
            </p>
          </div>
        </div>
      </section>

      <section className="hero min-h-screen">
        <div className="hero-content flex-col lg:flex-row-reverse md:gap-8 lg:gap-16 xl:gap-32">
          <Image
            width={687}
            height={1024}
            src="/images/hero-3.jpg"
            alt="A bunch of gymmers"
            className="max-w-sm rounded-lg shadow-2xl"
          />
          <div className="flex flex-col gap-8">
            <h2 className="text-3xl lg:text-5xl font-bold">
              Programs Built for Every Level
            </h2>
            <p className="text-xl text-base-content/50">
              Whether you’re just starting or leveling up, our guided workout
              paths help you stay consistent without overthinking. Build
              strength, confidence, and routine — one step at a time.
            </p>
          </div>
        </div>
      </section>

      <section className="hero min-h-screen">
        <div className="hero-content flex-col lg:flex-row md:gap-8 lg:gap-16 xl:gap-32">
          <Image
            width={687}
            height={1024}
            src="/images/hero-4.jpg"
            alt="Another Coach Charlie Kirk"
            className="max-w-sm rounded-lg shadow-2xl"
          />
          <div className="flex flex-col gap-8">
            <h2 className="text-3xl lg:text-5xl font-bold">
              Track Your Progress Effortlessly
            </h2>
            <p className="text-xl text-base-content/50">
              Visualize your improvement with simple progress charts and habit
              tracking tools. Stay motivated as you watch your consistency turn
              into real results.
            </p>
          </div>
        </div>
      </section>

      <section
        className="hero min-h-screen"
        style={{ backgroundImage: 'url("/images/hero-5.jpg")' }}
      >
        <div className="hero-overlay w-full h-full backdrop-brightness-75 backdrop-blur-xs"></div>
        <div className="hero-content flex-col">
          <h2 className="text-3xl font-bold text-neutral-content">
            So what's stopping you?
          </h2>
          <h3 className="text-2xl font-semibold text-neutral-content/80 mb-4">
            Be a member of <i>GymEmbrace</i> and reap the benefits of being one!
          </h3>

          <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow 2xl text-base-content">
            <div className="card-body">
              <fieldset className="fieldset">
                <label htmlFor="sign-up-email">Email</label>
                <input
                  id="sign-up-email"
                  type="email"
                  className="input"
                  placeholder="Your email here"
                />
                <label htmlFor="sign-up-name">Name</label>
                <input
                  id="sign-up-name"
                  type="text"
                  className="input"
                  placeholder="Your name here"
                />
                <label htmlFor="sign-up-phone">Phone Number</label>
                <input
                  id="sign-up-phone"
                  type="text"
                  className="input"
                  placeholder="Your phone number here"
                />

                <button className="btn btn-primary mt-4">Sign me up!</button>
              </fieldset>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

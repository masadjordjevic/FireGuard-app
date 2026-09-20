import Image from "next/image";
import VolunteerHub from "@/components/VolunteerHub";

export default function VolunteersPage() {
  return (
    <div>
      <section className="hero-banner hero-banner-subtle">
        <Image
          src="https://images.unsplash.com/photo-1576707995936-a6cffe26ef7b?q=80&w=1600&auto=format&fit=crop"
          alt="Two firefighters working together to spray water on a fire"
          fill
          className="hero-banner-image"
        />
        <div className="hero-banner-overlay" />
        <div className="hero-banner-content">
          <h2>Volunteer Hub</h2>
          <p>Coordinate community response — from cleanup crews to supply runs.</p>
        </div>
      </section>
      <VolunteerHub />
    </div>
  );
}

export const STATUSES = ['Neu', 'Kontaktiert', 'Interessiert', 'Kunde'];
export const CATEGORIES = ['Restaurant', 'Café', 'Friseur & Barbershop', 'Fitnessstudio', 'Einzelhandel'];
// "Alles" ist bewusst kein Teil von CATEGORIES: es ist keine echte Kategorie zum
// manuellen Zuordnen/Filtern von Leads, sondern nur eine Sucheinstellung.
export const ALL_CATEGORIES_OPTION = 'Alle Kategorien';
// Eigene Liste für Vorlagen: Barber & Friseur haben unterschiedlichen Ton/Text,
// deshalb hier bewusst getrennt, auch wenn die Lead-Suche sie zusammenfasst.
export const TEMPLATE_CATEGORIES = ['Restaurant', 'Café', 'Friseur', 'Barber', 'Fitnessstudio', 'Einzelhandel', 'Online-Shop'];

export const CITIES = ['Berlin', 'Mönchengladbach', 'Düsseldorf'];
export const CITY_DISTRICTS = {
  Berlin: ['Mitte', 'Kreuzberg', 'Neukölln', 'Friedrichshain', 'Prenzlauer Berg', 'Wedding', 'Charlottenburg', 'Schöneberg', 'Moabit', 'Tempelhof', 'Lichtenberg', 'Treptow', 'Marzahn', 'Hellersdorf', 'Spandau', 'Reinickendorf'],
  'Mönchengladbach': ['Innenstadt', 'Rheydt', 'Neuwerk', 'Odenkirchen', 'Hardt', 'Rheindahlen', 'Wickrath', 'Eicken', 'Giesenkirchen', 'Holt', 'Venn', 'Rheindahlen-Mitte', 'Rheindahlen-Süd', 'Rheindahlen-Nord', 'Wickrathberg', 'Wickrathhahn', 'Wickrathhahn-Süd', 'Wickrathhahn-Nord'],
  Düsseldorf: ['Altstadt', 'Stadtmitte', 'Flingern', 'Oberkassel', 'Pempelfort', 'Bilk', 'Derendorf', 'Lörick', 'Golzheim', 'Heerdt', 'Benrath', 'Hamm', 'Vennhausen', 'Wersten', 'Stockum', 'Unterrath'],
};
// Für Stellen, die nur eine flache Bezirksliste brauchen (z. B. freie Filter/Formulare)
export const DISTRICTS = Object.values(CITY_DISTRICTS).flat();

export function scoreTone(score) {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 65) return 'medium';
  return 'low';
}

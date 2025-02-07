Geprioriteerde Backlog voor Releasenotes App

Item modellen
User Story: Als developer wil ik modellen voor de volgende entiteiten zodat ik consistentie en eenvoud kan garanderen bij het verwerken en opslaan van gegevens.

Context en Uitleg: De applicatie moet gegevens van Azure DevOps synchroniseren en opslaan in een database. Om ervoor te zorgen dat gegevens op een gestandaardiseerde manier worden verwerkt, moeten er duidelijke datamodellen worden ontwikkeld voor de volgende entiteiten:

Item: Dit model vertegenwoordigt individuele backlog-items uit Azure DevOps en bevat zowel standaardvelden als aangepaste velden. Deze velden zijn ontworpen om alle benodigde informatie voor de applicatie te bevatten, zoals:

Standaardvelden:
id: Unieke identifier voor een backlog-item.
System.Title: Titel van het backlog-item.
System.AreaPath: Categorie of gebied gekoppeld aan het item.
System.WorkItemType: Type werkitem (bijv. Bug, User Story).
Aangepaste velden:
Custom.Gemeente: Gemeente-specifieke informatie.
Custom.Servicepack: Boolean voor servicepack-releases.
Custom.Release: Koppeling naar een release (Foreign Key).
Custom.UserStory: Informatie over gerelateerde user story.
Custom.Acceptatiecriteria: Beschrijving van de acceptatiecriteria.
Custom.Stuurdatawijzigingen: Beschrijving van dataveranderingen.
Custom.Batchwijzigingen: Batchwijzigingsinformatie.
Custom.Aandachtspunten: Belangrijke aandachtspunten.
Release: Dit model representeert een softwareversie die wordt bijgehouden in Azure DevOps. Het bevat:

id: Unieke identifier voor de release.
name: Naam van de release.
applicatie: Naam van de applicatie waartoe de release behoort (bijvoorbeeld Socrates of ServicesEnInteratie).
Acceptatiecriteria:

Modellen moeten compatibel zijn met de database die wordt gebruikt (bijvoorbeeld Azure Cosmos DB met SQL API voor prod en SQLite vor Dev).
Datatypen en veldnamen moeten overeenkomen met de structuur van Azure DevOps-gegevens.
Modellen moeten zowel lees- als schrijfoperaties ondersteunen.
Implementatiestappen:

Definieer de Item- en Release-modellen in de backend (met een Express ORM).
Zorg ervoor dat veldvalidatie wordt toegevoegd om consistentie in de data te waarborgen.
Documenteer de datamodellen voor andere ontwikkelaars en stakeholders.
Voeg unit tests toe om te garanderen dat de modellen correct werken bij interactie met echte data uit Azure DevOps.

1. Database Structuur voor Releases en Backlog-items (Hoog)

User Story:

Als administrator wil ik dat de database backlog-items en releases correct opslaat zodat gegevens consistent blijven.

Acceptatiecriteria:

De database bevat tabellen voor backlog-items en releases.

Elke backlog-item heeft een relatie met een release.

Taakomschrijving:

Ontwerp een database met tabellen zoals 'BacklogItems' en 'Releases'.

Implementeer databasemigraties met tools zoals Entity Framework of Liquibase.

2. Synchronisatie met Azure DevOps (Hoog)

User Story:

Als administrator wil ik dat het systeem elke uur backlog-items synchroniseert met Azure DevOps zodat de database up-to-date blijft.

Acceptatiecriteria:

Het systeem haalt nieuwe of bijgewerkte items op uit Azure DevOps.

De laatste wijzigingsdatum van elk item wordt opgeslagen.

Taakomschrijving:

Implementeer een scheduler die elk uur een synchronisatieproces start.

Maak API-calls naar Azure DevOps om backlog-items en wijzigingen op te halen.

Update de lokale database met de opgehaalde gegevens.

3. Ophalen van Release Informatie (Hoog)

User Story:

Als productmanager wil ik dat releasenotes worden georganiseerd op basis van releases zoals gedefinieerd in Azure DevOps.

Acceptatiecriteria:

Backlog-items worden gekoppeld aan releases zoals gedefinieerd in Azure DevOps.

Release-informatie wordt direct opgehaald uit Azure DevOps.

Taakomschrijving:

Voeg API-calls toe om releasegegevens uit Azure DevOps te halen.

De releases zijn een custom field op de Product Backlog Items en de Bugs in Azure DevOps. De eerste keer dat een nieuwe waarde in dit veld wordt gezien, moet deze opgeslagen worden als nieuwe release. In het datamodel in onze app moet dit veld in het item vervolgens vervangen worden door het release ID wat verwijst naar het corresponderende release in het release model.

Zorg ervoor dat items correct aan de releases worden gekoppeld in de database.

4. Weergave van Releasenotes op een Webpagina (Hoog)

User Story:

Als gebruiker wil ik releasenotes kunnen bekijken op een webpagina zodat ik gemakkelijk toegang heb tot de laatste wijzigingen.

Acceptatiecriteria:

De webpagina toont releasenotes gegroepeerd per applicatie en release.

Gebruikers kunnen filteren op applicatie (bijvoorbeeld Socrates of ServicesEnInteratie).

Taakomschrijving:

Bouw een frontend met eenvoudige HTML en CSS op basis van Bootstrap.

Implementeer filteropties voor applicaties.

Zorg voor een responsive layout met Bootstrap-componenten.

5. PDF Export van Releasenotes (Middel)

User Story:

Als productmanager wil ik releasenotes naar PDF kunnen exporteren zodat ik deze kan delen met stakeholders.

Acceptatiecriteria:

Het systeem genereert een PDF met releasenotes voor een geselecteerde release.

De PDF bevat de applicatienaam, releaseversie en een lijst met items.

Taakomschrijving:

Gebruik een PDF-generatielibrary (zoals iText of Puppeteer) om releasenotes te exporteren.

Voeg een knop toe aan de frontend voor het downloaden van de PDF.

6. Error Tracking voor Synchronisatie (Middel)

User Story:

Als administrator wil ik notificaties ontvangen bij synchronisatiefouten zodat ik actie kan ondernemen.

Acceptatiecriteria:

Het systeem logt synchronisatiefouten.

Administrators ontvangen een melding wanneer de synchronisatie faalt.

Taakomschrijving:

Voeg foutafhandeling toe aan de synchronisatieprocessen.

Bouw een notificatiesysteem dat fouten logt en meldingen verstuurt (bijvoorbeeld via e-mail of een admin-dashboard).

7. Weergave van Applicatie-specifieke Informatie (Laag)

User Story:

Als gebruiker wil ik releasenotes gegroepeerd per applicatie kunnen bekijken zodat ik gefocust de juiste informatie zie.

Acceptatiecriteria:

Releasenotes zijn gecategoriseerd per applicatie.

Gebruikers kunnen schakelen tussen applicaties om de respectieve notes te zien.

Taakomschrijving:

Voeg een categorie-indeling toe aan de frontend.

Pas API-endpoints aan om filters voor applicaties te ondersteunen.

8. Prestaties en Schaalbaarheid (Laag)

User Story:

Als systeembeheerder wil ik dat de app tot 10.000 items aankan zonder prestatieverlies zodat de gebruikerservaring soepel blijft.

Acceptatiecriteria:

De synchronisatie en weergaveprocessen ondersteunen tot 10.000 items.

Taakomschrijving:

Optimaliseer databasequeries en API-responses.

Implementeer paginering in de frontend met behulp van eenvoudige HTML en Bootstrap-componenten.

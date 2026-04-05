# Recrute — Guide de démarrage

## Prérequis

Avant de commencer, assurez-vous d'avoir installé les éléments suivants.

### Java 17 ou supérieur

```bash
java -version
```

### Maven

```bash
mvn -v
```

### MySQL

Si vous n'avez par MySQL, voici le lien de téléchargement pour Windows: 

[Download MySQL](https://dev.mysql.com/downloads/file/?id=548820)

Une instance MySQL doit être en cours d'exécution. Créez la base de données et l'utilisateur dédiés à l'application.

Pour cela lorsque vous êtes dans MySQL connections, connectez vous sur Local Instance.

Une page s'ouvre avec dedans la possibilité d'écrire du code sql.

Tapez-y :


```sql
CREATE DATABASE recrute_db;
CREATE USER 'recrute_user'@'localhost' IDENTIFIED BY 'mon_mdp';
GRANT ALL PRIVILEGES ON recrute_db.* TO 'recrute_user'@'localhost';
FLUSH PRIVILEGES;
```
> Remplacez `recrute_user` par l'utilisateur de votre choix.
> Remplacez `mon_mdp` par le mot de passe de votre choix.

Puis executez en appuyant sur l'éclair.
---

## Configuration de l'application

Modifiez le fichier `src/main/resources/application.properties` pour configurer la connexion à MySQL :

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/recrute_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=**recrute_user**
spring.datasource.password=**mon_mdp**
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
```
> Remplacez `recrute_user` par l'utilisateur de votre choix.
> Remplacez `mon_mdp` par le mot de passe de votre choix.

---

## Installation et compilation

Depuis le répertoire racine du projet :

```bash
cd recrute
mvn install
```

Cette commande télécharge toutes les dépendances et compile le projet.

---

## Lancer l'application

Toujours depuis le répertoire racine :

```bash
mvn spring-boot:run
```

L'application démarre sur [http://localhost:8080](http://localhost:8080).

> Les tables sont créées automatiquement dans MySQL via Hibernate au premier démarrage.
// dataGenerator.js

const firstNames = [
    "Ahmed", "Saeed", "Salim", "Mohammed", "Ali", "Sultan", "Hamood", "Talal", "Majid", "Fahad",
    "Ibrahim", "Hilal", "Khalid", "Nasser", "Hamed", "Yaqoob", "Waleed", "Bader", "Rashid", "Yousef",
    "Mubarak", "Amer", "Mansoor", "Juma", "Abdullah", "Issa", "Hassan", "Samir", "Mahmood", "Habib",
    "Ammar", "Khamis", "Nabil", "Anwar", "Khalifa", "Mazin", "Marwan", "Zayed", "Murad", "Hani",
    "Faris", "Qais", "Omar", "Bassam", "Walid", "Ayman", "Rami", "Khalfan", "Shaaban", "Saif",
    "Rawan", "Layla", "Aisha", "Fatma", "Maryam", "Maha", "Shamsa", "Buthaina", "Najla", "Hind",
    "Muna", "Asma", "Sara", "Alya", "Hanan", "Zahra", "Sama", "Noor", "Suhaila", "Tahira",
    "Muzna", "Lujaina", "Salma", "Afra", "Shaima", "Nisreen", "Huda", "Sana", "Hiba", "Ibtisam",
    "Ruqaiya", "Amal", "Amira", "Khadija", "Jawaher", "Zainab", "Rawiya", "Ghada", "Rashida", "Sumaya",
    "Samira", "Hajer", "Mariam", "Reem", "Badria", "Fadwa", "Wafa", "Maysaa", "Shahad", "Aseel",
    "Shurooq", "Rabaa", "Dalal", "Samya", "Basma", "Safiya", "Lubna", "Maysoun", "Arwa", "Jamila",
    "Nawal", "Najat", "Khawla", "Randa", "Shatha", "Wijdan", "Dina", "Fatin", "Haleema", "Jumana",
    "Fayza", "Salwa", "Duaa", "Sundus", "Iman", "Ghaliya", "Amani", "Shifa", "Nahla", "Rana",
    "Abir", "Nadine", "Manar", "Hessa", "Fawzia", "Nashwa", "Rawdah", "Madiha", "Munira", "Shaikha",
    "Mazoon", "Haifa", "Hoor", "Zakia", "Nouran", "Fajr", "Nisreen", "Yasmin", "Yumna", "Shurooq",
    "Rim", "Lina", "Nada", "Salsabil", "Ibtihaj", "Rimsha", "Mawaddah", "Maha", "Thuraya", "Najwa",
    "Ghalia", "Shahira", "Samah", "Rowaida", "Mahra", "Hooria", "Ruba", "Sahar", "Hala", "Rasha",
    "Siba", "Misk", "Jouri", "Dania", "Zina", "Amjad", "Lama", "Siham", "Inas", "Nour",
    "Ahlam", "Hind", "Sajida", "Basma", "Wissal", "Shatha", "Areej", "Dalia", "Rawya", "Sabah",
    "Alya", "Nadia", "Rania", "Asma", "Sumaiya", "Reham", "Arij", "Ibtisam", "Afnan", "Malak",
    "Shouq", "Joud", "Razan", "Najwa", "Mays", "Nada", "Razan", "Lulwa", "Tala", "Rehab",
    "Ghada", "Yasmeen", "Siba", "Maitha", "Hessa", "Alia", "Dana", "Rola", "Noura", "Abeer",
    "Sawsan", "Haya", "Widad", "Jawaher", "Nahed", "Rabab", "Shams", "Areej", "Ruba", "Layan",
    "Fay", "Saif", "Suhail", "Riyadh", "Nizar", "Shihab", "Lutfi", "Shaker", "Bakr", "Abdulrahman",
    "Sadiq", "Muthanna", "Younis", "Samer", "Ilyas", "Khaled", "Talib", "Sabbir", "Fadil", "Waleed",
    "Rashad", "Majed", "Raed", "Nasir", "Bassel", "Barakat", "Murshid", "Haytham", "Ghanem", "Hatim",
    "Rafe", "Qais", "Munir", "Zuhair", "Othman", "Zaid", "Tariq", "Aadel", "Saad", "Marwan",
    "Fadhel", "Shaheen", "Abdelaziz", "Basheer", "Ghassan", "Zain", "Nawaf", "Faiz", "Sami", "Kamal",
    "Rami", "Rafid", "Yamen", "Shams", "Maher", "Hazem", "Thamer", "Hussain", "Ayham", "Yazid",
    "Wajdi", "Rashwan", "Labib", "Motasem", "Sami", "Salah", "Mazin", "Naseem", "Wissam", "Yasser",
    "Sari", "Jad", "Tamer", "Zaher", "Samer", "Husam", "Khalil", "Ayman", "Kareem", "Osama"
  ];

  const lastNames = [
    "Al-Busaidi", "Al-Harthy", "Al-Lawati", "Al-Maashani", "Al-Habsi", "Al-Raisi", "Al-Hinai", "Al-Maamari", "Al-Araimi", "Al-Kalbani",
    "Al-Mugheiri", "Al-Balushi", "Al-Maskari", "Al-Amri", "Al-Mahrouqi", "Al-Shibli", "Al-Siyabi", "Al-Saadi", "Al-Farsi", "Al-Khalili",
    "Al-Nabhani", "Al-Badi", "Al-Battashi", "Al-Suleimani", "Al-Jahwari", "Al-Mundhiri", "Al-Qassabi", "Al-Shanfari", "Al-Barwani", "Al-Mandhari",
    "Al-Subhi", "Al-Bakri", "Al-Jabri", "Al-Ghafri", "Al-Ajmi", "Al-Kaabi", "Al-Rawahi", "Al-Dhuhli", "Al-Mauly", "Al-Azizi",
    "Al-Abri", "Al-Haddabi", "Al-Hatmi", "Al-Rawahi", "Al-Aufi", "Al-Kindi", "Al-Hinawi", "Al-Zadjali", "Al-Bahrani", "Al-Matrushi",
    "Al-Shukaili", "Al-Qasmi", "Al-Nasri", "Al-Ghamari", "Al-Shamli", "Al-Farqani", "Al-Khanjari", "Al-Bulushi", "Al-Rowas", "Al-Nabhani",
    "Al-Rawas", "Al-Rawahi", "Al-Badi", "Al-Yahyai", "Al-Saidi", "Al-Ghazali", "Al-Touqi", "Al-Mahri", "Al-Saifi", "Al-Rawahi",
    "Al-Shahri", "Al-Mukhaini", "Al-Jadidi", "Al-Harthi", "Al-Mamari", "Al-Habsi", "Al-Balushi", "Al-Amri", "Al-Mahrouqi", "Al-Shibli",
    "Al-Siyabi", "Al-Saadi", "Al-Farsi", "Al-Khalili", "Al-Nabhani", "Al-Badi", "Al-Battashi", "Al-Suleimani", "Al-Jahwari", "Al-Mundhiri",
    "Al-Qassabi", "Al-Shanfari", "Al-Barwani", "Al-Mandhari", "Al-Subhi", "Al-Bakri", "Al-Jabri", "Al-Ghafri", "Al-Ajmi", "Al-Kaabi",
    "Al-Rawahi", "Al-Dhuhli", "Al-Mauly", "Al-Azizi", "Al-Abri", "Al-Haddabi", "Al-Hatmi", "Al-Rawahi", "Al-Aufi", "Al-Kindi",
    "Al-Hinawi", "Al-Zadjali", "Al-Bahrani", "Al-Matrushi", "Al-Shukaili", "Al-Qasmi", "Al-Nasri", "Al-Ghamari", "Al-Shamli", "Al-Farqani",
    "Al-Khanjari", "Al-Bulushi", "Al-Rowas", "Al-Nabhani", "Al-Rawas", "Al-Yahyai", "Al-Saidi", "Al-Ghazali", "Al-Touqi", "Al-Mahri",
    "Al-Saifi", "Al-Shahri", "Al-Mukhaini", "Al-Jadidi", "Al-Harthy", "Al-Kalbani", "Al-Buraiki", "Al-Mahdari", "Al-Mazrui", "Al-Shukri",
    "Al-Salmani", "Al-Shahri", "Al-Mughairy", "Al-Mazroui", "Al-Mahrooqi", "Al-Bahwan", "Al-Yahmadi", "Al-Qatabi", "Al-Qatari", "Al-Kharoosi",
    "Al-Ghassani", "Al-Balushi", "Al-Rashdi", "Al-Harthy", "Al-Fahdi", "Al-Nasseri", "Al-Athab", "Al-Khatri", "Al-Busaeedi", "Al-Rawas",
    "Al-Haddad", "Al-Ghassani", "Al-Sumairi", "Al-Khasibi", "Al-Aamri", "Al-Muqbali", "Al-Mashari", "Al-Zadjali", "Al-Ghazali", "Al-Naabi",
    "Al-Ma’awali", "Al-Qassabi", "Al-Subhi", "Al-Salami", "Al-Habsi", "Al-Aufi", "Al-Saidi", "Al-Malki", "Al-Raisi", "Al-Mamari",
    "Al-Harithi", "Al-Harthy", "Al-Basri", "Al-Basheer", "Al-Balushi", "Al-Kindi", "Al-Farhadi", "Al-Sharji", "Al-Buraimi", "Al-Farisi",
    "Al-Mugheiry", "Al-Kharusi", "Al-Mansoori", "Al-Busaidi", "Al-Rawas", "Al-Kindi", "Al-Jabri", "Al-Shibli", "Al-Mahri", "Al-Nabhani",
    "Al-Maamari", "Al-Mukhaini", "Al-Amri", "Al-Hinai", "Al-Battashi", "Al-Balushi", "Al-Barwani", "Al-Shanfari", "Al-Kalbani", "Al-Qasmi",
    "Al-Hinawi", "Al-Shukaili", "Al-Mauly", "Al-Bahwan", "Al-Mahrooqi", "Al-Salmi", "Al-Nasri", "Al-Mundhiri", "Al-Mashani", "Al-Haddabi",
    "Al-Jadidi", "Al-Qatani", "Al-Ajmi", "Al-Araimi", "Al-Maskari", "Al-Rawahi", "Al-Sulaimi", "Al-Ghassani", "Al-Dhuhli", "Al-Mahrouqi",
    "Al-Mutairi", "Al-Harthy", "Al-Mazroui", "Al-Mugheiri", "Al-Khalili", "Al-Abri", "Al-Busaidi", "Al-Harthy", "Al-Kalbani", "Al-Lawati",
    "Al-Maashani", "Al-Habsi", "Al-Raisi", "Al-Hinai", "Al-Maamari", "Al-Araimi", "Al-Kalbani", "Al-Mugheiri", "Al-Balushi", "Al-Maskari",
    "Al-Amri", "Al-Mahrouqi", "Al-Shibli", "Al-Siyabi", "Al-Saadi", "Al-Farsi", "Al-Khalili", "Al-Nabhani", "Al-Badi", "Al-Battashi",
    "Al-Suleimani", "Al-Jahwari", "Al-Mundhiri", "Al-Qassabi", "Al-Shanfari", "Al-Barwani", "Al-Mandhari", "Al-Subhi", "Al-Bakri", "Al-Jabri",
    "Al-Ghafri", "Al-Ajmi", "Al-Kaabi", "Al-Rawahi", "Al-Dhuhli", "Al-Mauly", "Al-Azizi", "Al-Abri", "Al-Haddabi", "Al-Hatmi"
  ];
  
export function getRandomName() {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${firstName} ${lastName}`;
}

export function getRandomDate(startYear = 1970, endYear = 2005) {
    const year = Math.floor(Math.random() * (endYear - startYear + 1)) + startYear;
    const month = Math.floor(Math.random() * 12) + 1;
    const day = Math.floor(Math.random() * 28) + 1; // Keep it simple, always valid for Feb
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getRandomCivilNumber(length = 10) {
    let number = '';
    for (let i = 0; i < length; i++) {
        number += Math.floor(Math.random() * 10);
    }
    return number;
}
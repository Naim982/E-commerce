export const BANGLADESH_DISTRICTS = [
    'Bagerhat',
    'Bandarban',
    'Barguna',
    'Barishal',
    'Bhola',
    'Bogura',
    'Brahmanbaria',
    'Chandpur',
    'Chapainawabganj',
    'Chattogram',
    'Chuadanga',
    'Cox\'s Bazar',
    'Cumilla',
    'Dhaka',
    'Dinajpur',
    'Faridpur',
    'Feni',
    'Gaibandha',
    'Gazipur',
    'Gopalganj',
    'Habiganj',
    'Jamalpur',
    'Jashore',
    'Jhalokathi',
    'Jhenaidah',
    'Joypurhat',
    'Khagrachhari',
    'Khulna',
    'Kishoreganj',
    'Kurigram',
    'Kushtia',
    'Lakshmipur',
    'Lalmonirhat',
    'Madaripur',
    'Magura',
    'Manikganj',
    'Meherpur',
    'Moulvibazar',
    'Munshiganj',
    'Mymensingh',
    'Naogaon',
    'Narail',
    'Narayanganj',
    'Narsingdi',
    'Natore',
    'Netrokona',
    'Nilphamari',
    'Noakhali',
    'Pabna',
    'Panchagarh',
    'Patuakhali',
    'Pirojpur',
    'Rajbari',
    'Rajshahi',
    'Rangamati',
    'Rangpur',
    'Satkhira',
    'Shariatpur',
    'Sherpur',
    'Sirajganj',
    'Sunamganj',
    'Sylhet',
    'Tangail',
    'Thakurgaon'
];

/**
 * Format address lines in hierarchical order (small to big):
 * 1. Apartment, Unit (Optional)
 * 2. Street Address
 * 3. Village / Area
 * 4. Police Station (Thana)
 * 5. District & Postal Code
 */
export const getFormattedAddressLines = (address) => {
    if (!address) return [];

    const lines = [];
    const apartment = (address.apartment || address.suite || '').trim();
    const street = (address.street || '').trim();
    const villageArea = (address.villageArea || address.area || address.city || '').trim();
    const thana = (address.thana || address.policeStation || address.state || '').trim();
    const postalCode = (address.postalCode || address.zipCode || address.postal || '').trim();
    const district = (address.district || (address.country !== 'Bangladesh' ? address.country : '') || '').trim();

    if (apartment) {
        lines.push(apartment);
    }

    if (street) {
        lines.push(street);
    }

    const localAreaParts = [];
    if (villageArea) localAreaParts.push(villageArea);
    if (thana) localAreaParts.push(`Thana: ${thana}`);
    if (localAreaParts.length > 0) {
        lines.push(localAreaParts.join(', '));
    }

    const regionalParts = [];
    if (district) regionalParts.push(district);
    if (postalCode) regionalParts.push(postalCode);
    if (regionalParts.length > 0) {
        lines.push(regionalParts.join(' - '));
    }

    return lines;
};

export const formatAddressSingleLine = (address) => {
    const lines = getFormattedAddressLines(address);
    return lines.join(', ');
};

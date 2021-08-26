const xlsx = require('xlsx');
const GCS = require('./storage')

const toExcel = async (comparison, comparisonFields) => {
    const tableRows = [];
    const workSheetColumnNames = [
        "B1_ID",
        "ignite_client_key",
        "Yelp_ID",
        comparisonFields.fieldA,
        comparisonFields.fieldB
    ];
    const workSheetName = 'Comparison';

    comparison.differences.forEach(difference => {
        const tmp = [
            difference.itemA.listing_id,
            difference.itemA.ignite_client_key,
            difference.itemB.id,
            difference.itemB["attributes.AboutThisBizSpecialties"],
            difference.itemA.long_description,
        ];
        tableRows.push(tmp)
    });
    comparison.notMatched.forEach(yelpId => {
        const tmp = [,yelpId,,];
        tableRows.push(tmp)
    });

    const workBook = xlsx.utils.book_new();
    const workSheetData = [
        workSheetColumnNames,
        ...tableRows
    ];
    const workSheet = xlsx.utils.aoa_to_sheet(workSheetData);
    xlsx.utils.book_append_sheet(workBook, workSheet, workSheetName);
    // uncomment to save file locally
    // xlsx.writeFile(workBook, path.resolve(filePath));

    const storage = new GCS({});
    const csv = xlsx.utils.sheet_to_csv(workBook.Sheets.Comparison);

    await storage.uploadComparison(csv);
};

module.exports = {
    toExcel
}
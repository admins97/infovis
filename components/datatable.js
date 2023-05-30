class DataTable {
    constructor(id) {
        this.id = id;
    }

    update(data, columns) {
        // console.log(columns)
        let table = d3.select(this.id);
        // movieNum = [...new Set(data.map(d => d['movie.num']))]

        let rows = table
            .selectAll("tr")
            .data(data)
            .join("tr");
        rows.selectAll("td")
            .data(d => columns.map(c => d[c]))
            .join("td")
            .text(d => d)
        // TODO: create as many <tr>s as rows
        // TODO: populate <td>s in each row        
    }
}

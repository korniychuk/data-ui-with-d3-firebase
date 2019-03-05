const dims = { width: 300, height: 300, radius: 150 };
const cent = { x: (dims.width / 2) + 5, y: (dims.height / 2) + 5 };

const svg = d3.select('.canvas')
    .append('svg')
    .attr('width', dims.width + 150)
    .attr('height', dims.height + 150)
;

const graph = svg.append('g').attr('transform', `translate(${cent.x}, ${cent.y})`);

const pie = d3.pie()
    .sort(null)
    .value(v => v.cost)
;

const arcPath = d3.arc()
    .outerRadius(dims.radius)
    .innerRadius(dims.radius / 2)
;

const colour = d3.scaleOrdinal(d3['schemeSet3']);

const legendGroup = svg.append('g').attr('transform', `translate(${dims.width + 40}, 10)`);
const legend = d3.legendColor()
    .shape('circle')
    .shapePadding(10)
    .scale(colour)
;

const tip = d3.tip()
    .attr('class', 'tip card')
    .html(d => `<div class="name">${d.name}</div>`
             + `<div class="cost">${d.cost}</div>`
             + `<div class="delete">Click slice to delete</div>`
    )
;

svg.call(tip);

const handleMouseOver = (d, i, n) => {
    tip.show(d.data, n[i]);
    d3.select(n[i])
        .transition('white-on-hover').duration(300)
            .attr('fill', 'white')
    ;
};
const handleMouseLeave = (d, i, n) => {
    tip.hide(d.data, n[i]);
    d3.select(n[i])
        .transition('white-on-hover').duration(300)
            .attr('fill', colour(d.data.name))
    ;
};
const handleSectorClick = (d, i, n) => {
   const id = d.data.id;
    if (!id) {
        return console.error('Can not find ID');
    }
    db.collection('expenses').doc(id).delete();
};

const enterTween = (d) => {
    const i = d3.interpolate(d.endAngle, d.startAngle);

    return t => arcPath({ ...d, startAngle: i(t) });
};

const update = (data) => {
    console.log('update() data:', data);

    // 1. update data
    const paths = graph.selectAll('path').data(pie(data));

    // 2. scales
    colour.domain(data.map(v => v.name));

    // 3. removing
    paths.exit().remove();

    // 4. updating
    paths
        .attr('d', arcPath)
        .attr('fill', d => colour(d.data.name))
        .attr('stroke', 'white')
        .attr('stroke-width', 3)
    ;

    // 5. entering new elements
    paths.enter()
        .append('path')
        .attr('fill', d => colour(d.data.name))
        .attr('stroke', 'white')
        .attr('stroke-width', 3)
        .on('mouseover', handleMouseOver)
        .on('mouseleave', handleMouseLeave)
        .on('click', handleSectorClick)
        .transition().duration(750)
            .attrTween('d', enterTween)
    ;

    // 6. legend
    legendGroup.call(legend);
    legendGroup.selectAll('text').attr('fill', 'white');
};

let data = [];
db.collection('expenses').onSnapshot(res => {
    res.docChanges().forEach(change => {
        const doc = { ...change.doc.data(), id: change.doc.id };
        switch (change.type) {
            case 'added':
                data.push(doc);
                break;

            case 'modified':
                const index = data.findIndex(v => v.id === doc.id);
                data[index] = doc;
                break;

            case 'removed':
                data = data.filter(v => v.id !== doc.id);
                break;
        }
    });
    update(data);
});

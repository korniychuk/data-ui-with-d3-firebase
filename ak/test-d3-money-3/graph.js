const dims = { width: 300, height: 300, radius: 150 };
const cent = { x: (dims.width / 2) + 5, y: (dims.height / 2) + 5 };

const svg = d3.select('.canvas')
    .append('svg')
    .attr('width', dims.width + 150)
    .attr('height', dims.width + 150)
;

const graph = svg.append('g')
    .attr('transform', `translate(${cent.x}, ${cent.y})`)
;

const pie = d3.pie()
    .sort(null)
    .value(v => v.cost)
;

// paths vs path
const arcPath = d3.arc()
    .outerRadius(dims.radius)
    .innerRadius(dims.radius / 2)
;

const colour = d3.scaleOrdinal(d3['schemeSet3']);

const handleSectorClick = (d, i, n) => {
    const id = d.data.id;
    if (!id) {
        console.log('handleSectorClick() no ID:', id);
        return;
    }

    db.collection('expenses').doc(id).delete();
};

const tip = d3.tip()
    .attr('class', 'tip card')
    .html(data =>
          `<div class="name">${data.name}</div>`
        + `<div class="cost">${data.cost}</div>`
        + `<div class="delete">Click slice to delete</div>`
    )
;

// а graph ли?
graph.call(tip);

const handleSectorOver = (d, i, n) => {
    tip.show(d.data, n[i]);
    d3.select(n[i])
        .transition('colorize-on-hover').duration(300)
            .attr('fill', 'white');
};
const handleSectorLeave = (d, i, n) => {
    tip.hide(d.data, n[i]);
    d3.select(n[i])
        .transition('colorize-on-hover').duration(300)
        .attr('fill', colour(d.data.name));
};

const legendGroup = svg.append('g').attr('transform', `translate(${dims.width + 40}, 10)`);
const legend = d3.legendColor()
    .shape('circle')
    .shapePadding(10)
    .scale(colour)
;

const enterTween = (d) => {
    const i = d3.interpolate(d.endAngle, d.startAngle);

    return t => arcPath({ ...d, startAngle: i(t) });
};
const exitTween = (d) => {
    const i = d3.interpolate(d.startAngle, d.endAngle);

    return t => arcPath({ ...d, startAngle: i(t) });
};

const updateTween = function(d) {
    const i = d3.interpolate(this._current, d);

    this._current = d;

    return t => arcPath(i(t));
};

const update = (data) => {
    console.log('update() data:', data);

    // 1. update data
    const paths = graph.selectAll('path').data(pie(data));

    // 2. update domains
    colour.domain(data.map(v => v.name));

    // 3. exiting elements
    paths.exit()
        .transition().duration(750)
        .attrTween('d', exitTween)
        .remove();

    // 4. updating elements
    paths
        .attr('stroke', 'white')
        .attr('stroke-width', 3)
        .attr('fill', d => colour(d.data.name))
        .transition().duration(750)
            .attrTween('d', updateTween)
    ;

    // 5. entering elements
    paths.enter()
        .append('path')
        .attr('stroke', 'white')
        .attr('stroke-width', 3)
        .attr('fill', d => colour(d.data.name))
        .on('mouseover', handleSectorOver)
        .on('mouseleave', handleSectorLeave)
        .on('click', handleSectorClick)
        .each(function(d) { this._current = d; })
        .transition().duration(750)
            .attrTween('d', enterTween)
    ;

    // 6. Legend
    legendGroup.call(legend);
    legendGroup.selectAll('text').attr('fill', 'white');
};

let data = [];
db.collection('expenses').onSnapshot((res) => {
    res.docChanges().forEach((change) => {
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

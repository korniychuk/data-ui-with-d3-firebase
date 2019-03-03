const dims = { width: 300, height: 300, radius: 150 };
const cent = { x: (dims.width / 2) + 5, y: (dims.height / 2) + 5 };

const svg = d3.select('.canvas')
    .append('svg')
    .attr('width', dims.width + 150)
    .attr('height', dims.height + 150)
;

const graph = svg.append('g')
    .attr('transform', `translate(${cent.x}, ${cent.y})`)
;

const pie = d3.pie()
    .sort(null)
    .value(d => d.cost)
;

const arcPath = d3.arc()
    .outerRadius(dims.radius)
    .innerRadius(dims.radius / 2)
;

const colour = d3.scaleOrdinal(d3['schemeSet3']);

const arcTweenEnter = (d) => {
    const i = d3.interpolate(d.endAngle, d.startAngle);
    return t => arcPath({ ...d, startAngle: i(t) });
};

const arcTweenExit = (d) => {
    const i = d3.interpolate(d.startAngle, d.endAngle);
    return t => arcPath({ ...d, startAngle: i(t) });
};

function arcTweenUpdate(d) {
    const i = d3.interpolate(this._current, d);

    this._current = d;

    return t => {
        const r = arcPath(i(t));

        return r;
    }
}

const legendGroup = svg.append('g').attr('transform', `translate(${dims.width + 40}, 10)`);
const legend = d3.legendColor()
    .shape('circle')
    .shapePadding(10)
    .scale(colour)
;

const handleMouseOver = (d, i, n) => {
    d3.select(n[i])
        .transition('changeSliceFill').duration(300)
            .attr('fill', '#fff');
};

const handleMouseLeave = (d, i, n) => {
    d3.select(n[i])
        .transition('changeSliceFill').duration(300)
            .attr('fill', colour(d.data.name));
};

const update = (data) => {
    console.log('update() data:', data);
    // 1.
    const paths = graph.selectAll('path').data(pie(data));

    // 2.
    colour.domain(data.map(v => v.name));

    // 3.
    paths.exit()
        .transition().duration(750)
        .attrTween('d', arcTweenExit)
        .remove();

    // 4.
    paths.attr('d', arcPath)
        .transition().duration(750)
        .attrTween('d', arcTweenUpdate)
    ;

    // 5.
    paths.enter()
        .append('path')
            // .attr('class', 'arc')
            .attr('d', arcPath)
            .attr('stroke', '#fff')
            .attr('stroke-width', 3)
            .attr('fill', d => colour(d.data.name))
            .each(function(d) { this._current = d; })
            .transition().duration(750)
                .attrTween('d', arcTweenEnter)
    ;

    // 6.
    legendGroup.call(legend);
    legendGroup.selectAll('text').attr('fill', 'white');

    // 7.
    graph.selectAll('path')
        .on('mouseover', handleMouseOver)
        .on('mouseleave', handleMouseLeave)
    ;

};

const data = [];
db.collection('expenses').onSnapshot(res => {
    res.docChanges().forEach(change => {
        const doc = { ...change.doc.data(), id: change.doc.id };

        switch (change.type) {
            case 'added': {
                data.push(doc);
            } break;

            case 'modified': {
                const index = data.findIndex(v => v.id === doc.id);
                data[ index ] = doc;
            } break;

            case 'removed': {
                const index = data.findIndex(v => v.id === doc.id);
                data.splice(index, 1);
            } break;
        }
    });

    update(data);
});

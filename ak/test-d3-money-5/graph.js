const update = (data) => {
    console.log('update() data:', data);
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

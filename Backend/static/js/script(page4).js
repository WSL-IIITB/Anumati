document.addEventListener('DOMContentLoaded', (event)=>{
    const newConnectionBtn = document.getElementById('newConnectionBtn');
    newConnectionBtn.addEventListener('click', () => {
        let connectionName = prompt("Enter the name of new connection");
        if(connectionName){
            alert(`New Connection '${connectionName} created!`);
        }
    })
});
class Handler_AppMenu {
    constructor ( electronApp, electronMenu, socket ) {
        const _this = this

        this.list = {
            home: electronMenu.buildFromTemplate( [
                {
                    label: 'General',
                    submenu: [
                        { label: 'About' },
                        { label: 'Documentation' },
                        { label: 'Discord' },
                        {
                            label: 'Exit to Desktop',
                            click () {
                                electronApp.quit()
                            } 
                        }
                    ]
                },
            ] ),
            editors: {
                object: electronMenu.buildFromTemplate( [
                    {
                        label: 'File',
                        submenu: [
                            { label: 'New Object' },
                            { 
                                label: 'Open Object',
                                click () {
                                    socket.emit( '[client] load mystic file', 'object' )
                                }
                            },
                            { label: 'Save Current Object' },
                            { 
                                label: 'Save Current Object As',
                                click () {
                                    socket.emit( '[client] save object' )
                                }
                             },
                            { type:'separator' },
                            {
                                label: 'Import GLB', 
                                enabled: false 
                            },
                            { 
                                label: 'Import GLTF (Embedded)',
                                click () {
                                    socket.emit( '[client] read gltf (embedded)' )
                                }
                            },
                            { type:'separator' },
                            { label: 'About' },
                            { type:'separator' },
                            {
                                label: 'Close Editor',
                                click () {
                                    socket.emit( '[client] close editor', 'object' )
                                } 
                            },
                            {
                                label: 'Exit to Desktop',
                                click () {
                                    electronApp.quit()
                                } 
                            }
                        ]
                    },
                    {
                        label: 'Edit',
                        submenu: [
                            { 
                                label: 'Undo', 
                                enabled: false,
                            },
                            { 
                                label: 'Redo', 
                                enabled: false,
                            },
                            { 
                                label: 'Cut', 
                                enabled: false,
                            },
                            { 
                                label: 'Copy', 
                                enabled: false,
                            },
                            { 
                                label: 'Paste', 
                                enabled: false,
                            },
                            { 
                                type:'separator', 
                                enabled: false,
                            },
                            { label: 'Preferences' }
                        ]
                    },
                    {
                        label: 'Test',
                        submenu: [
                            {
                                label: 'Object LOD',
                                submenu: [
                                    { label: 'Auto' },
                                    { 
                                        label: 'Interactive',
                                        click () {
                                            socket.emit( '[client] begin object LOD test', 'interactive' )
                                        }
                                    }
                                ],
                            }
                        ]
                    },
                ] ),
            },
        }
    }
}

module.exports = { Handler_AppMenu }
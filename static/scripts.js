// Holds Google Map
var map;
//Stores all the airports and planes on map currently, as GoogleMap marker objects
var airports = [];
var planes = [];
var centers = [];
//Copy of the data fetched from server   //time of last update (stored in latest json)
var latest_json = [];
var update_time = 0;
//Currently clicked on airport's index
var selected_airport = -1;
var selected_plane = -1;
var selected_center = -1;
//Global variable for current mouse position; Google map listeners supposedly don't supply event.pageX values?
var mouseX;
var mouseY;
//Array
var airportLines = [];
var flightPath;
var airportCircles = [];

var updateCounter = 0;
//How often to update
var imgs = {0:   'data:image/gif;base64,R0lGODlhCgAKAIQWAA4ODp6enl1dXUZGRiUlJYuLixMTE9XV1d/f3xwcHNHR0TMzMwUFBS4uLujo6Pb29vr6+oaGhvHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAABYALAAAAAAKAAoAAAhcAC0ItKCggIWDCA8KIGChoUMLEgBUoGChosUCFSoMsMCRI4QEFUIisEDSAoUKKCtMsMDSwoAKMCsAkGDBwoEKOHMGsGBhQgUGAiYYqNDAggQCERxYsPAgwAIKAQEAOw==',
1: 'data:image/gif;base64,R0lGODdhDAAMAIQAAA4ODp6enl1dXUZGRiUlJYuLixMTE9XV1d/f3xwcHNHR0TMzMwUFBS4uLujo6Pb29vr6+oaGhvHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADAAMAAAIhAABCBxIkKCFgxYUAFjIEICFhxYEFLBA0QIAABYySgBAwIJHCwAAWBhZoEIFChZSAgBgwQKEBBUqDLBAE4AFCxQq6NSJwIIFABYsDKhAtMIECxYAALBwoIJTpwAkWAAAwMKECgwEVNgawAIAABIIRHBgYYKBCg0sAFjLFoCFBwEWUAAQEAA7',
20:  'data:image/gif;base64,R0lGODdhDQAOAIQAAA4ODp6enl1dXUZGRiUlJYuLixMTE9XV1d/f3xwcHDMzMwUFBejo6Pb29vr6+oaGhvHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADQAOAAAImAABCBxIsKBACQASKlwIgAIFBQEaAJhIcSKFABMMRKBAgQGAjx8pQJhAUsCCBwQgAABAgQIEABNixoxAAQAAChQiTNg5YcCEAxQAAKBAAcGEoxMkUKAAAACFpxQGTJiQwAEFCgAAUNgqYQKAAhTCUgAAgIJZCgQAQKDAFoBbtxQKFBBAoS4FAHjz4qXAly+Av4ADA6AAoHBAADs=',
21:  'data:image/gif;base64,R0lGODdhDgAOAIQAAA4ODp6enl1dXUZGRiUlJYuLixMTE9/f3xwcHNHR0TMzMwUFBS4uLujo6Pb29vr6+vHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADgAOAAAImQABCBxIsCBBCQoAKFzIUCEFBgEcAJhIkSKFABMMGKBAAYDHjxQoQJgwIYKABg0AqFRJgUKECTAnLJhAAAIAABRyHpjAs2cECgAAUBg6YILRCQMoUAAAgIJTCgMmTEAggYJVAAAoaKUwAUCBAg8oUABAliwFCgQEQKDAlgKAt3ALJKBAly6Au3jxUthLAYDfv4D9UqAAoDCAgAA7',
22:  'data:image/gif;base64,R0lGODdhDwAPAIQAAA4ODl1dXUZGRiUlJYuLixMTE9XV1d/f3xwcHNHR0TMzMwUFBS4uLujo6Pb29vr6+oaGhvHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADwAPAAAIoQABCBxIsKBBABMAKFzIcGEFBgoASJxIEUCFCgwoOADAsWPHChUiUChQoEIFAChTAqhQQQKFlwEaNABAk2aFCgckUNhJYQGEAQCCVhhagYLRoxIkRABQoWkFARSiUhBQwUAFAFgraKXAFcGDCRUqABg7tkKFAQAiEHhQoQKAt3ABEEhQoa5dAHjz5q3Aly+Av4ADA6hAGIDhw4gPVwDAuHFAADs=',
23:  'data:image/gif;base64,R0lGODdhDwAPAIQAAA4ODp6enl1dXUZGRiUlJYuLixMTE9/f3xwcHNHR0TMzMwUFBS4uLujo6Pb29vr6+vHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADwAPAAAInwABCBxIsKBBgRIAKFzIcCEFBgoASJxIEQCFAAwCOADAsSNHChQgQJhgwAEFAChTUlgZAcCECREoAJg5k4LNAwcm6JywoAGAnxSCUhgwoWjRBRMIAFhKoamECVCjRogAAYBVChQmAJiAQIIECmABiBVbQACAAhQeUFgLoK3bBBTiyqUAoK7duhTy5gXAt69fABQCAxhMuDBhCgASKwYQEAA7',
24:  'data:image/gif;base64,R0lGODdhDgAOAIQAAA4ODp6enl1dXUZGRiUlJYuLixMTE9XV1d/f3xwcHNHR0TMzMwUFBS4uLujo6Pb29vr6+oaGhvHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADgAOAAAIkgABCBxIsKBBABYoAFjIsKEFCw0WAJhIcaIFCxICVKjwAIDHjxZCWgBQwcADCwBSWlhpAcGECjAnWABA04JNCwMq6KwggIEDAEAtWKBQoajRChEAKLVggUCFp1ArTCAAoGoBAQAKJIBAwcIBCxIAiFVgoazZsgDSqrXAtq0FAHDjwrVA1wKAu3jzWrAAoK9fAAEBADs=',
25:  'data:image/gif;base64,R0lGODdhDQAOAIQAAA4ODp6enl1dXUZGRiUlJYuLixMTE9XV1d/f39HR0TMzMwUFBejo6Pb29vr6+oaGhvHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADQAOAAAIjAABCBxIsKBBABIAKFy4kIJDBQoASJRIoSIFCAEmBADAkYJHjxEATDDQAIBJCigpIIgwYYKBCBQAAKBAU8KACTgnCKAAoCcFChOCCl3AAIDRAgQATFjKdMIDAAASCKAAoYADCQMORCAAoCuFrxQcUBhLAQKAsxTSqk0LoG1bCnDhAphLly4FAHjz4g0IADs=',
26:  'data:image/gif;base64,R0lGODdhDAAMAIQAAA4ODp6enl1dXUZGRiUlJYuLixMTE9XV1d/f3xwcHNHR0TMzMwUFBS4uLujo6Pb29vr6+oaGhvHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADAAMAAAIfAABCBxIsOBACwgtUAAAwILDhxICNFgAAICFixcnAKhQIQAAABZCWkBQoaSBBwAAWLBAYUCFlxUmWAAAoACBCjhzVhBgAQAABQIAVBg6lIEDAAAsWJBQIAGFARUqRAAAwIJVCxAsWDgwgQAAABbCihUrAQAAC2jRAli7NiAAOw==',
27:  'data:image/gif;base64,R0lGODlhCgAKAIQWAA4ODp6enl1dXUZGRiUlJYuLixMTE9XV1d/f3xwcHNHR0TMzMwUFBS4uLujo6Pb29vr6+oaGhvHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAABYALAAAAAAKAAoAAAhWAC0IHDiQgoWDCCUEaLDAgkMLCCYAqFAhgAULFAZU2FjBwIMCBCqIHDnBggIBACqoVCnAgksJBRJUmMnAgYWbFiBQGFChQgQLQINaODCBgIWjSJFKCAgAOw==',
28:  'data:image/gif;base64,R0lGODdhDAAMAIQAAA4ODp6enl1dXUZGRiUlJYuLixMTE9XV1d/f3xwcHNHR0TMzMwUFBS4uLujo6Pb29vr6+oaGhvHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADAAMAAAIegABCBxIkKCFgwcBKFwIwILDhw8pAABgoaIFBBYkBGiwAAAACxYoDKgwAUCFCgEAAChAoILLlwYeAFAgAECFmzgnWABgwYKEAgkqCBVgAQAAC0gtQKjAlIEDAAAsSJVKYUCFChEAALDAtauFAxMIABhLFoCFsxYkAAgIADs=',
29:  'data:image/gif;base64,R0lGODdhDgANAIQAAA4ODp6enl1dXUZGRiUlJYuLixMTE9XV1d/f3xwcHDMzMwUFBejo6Pb29vr6+oaGhvHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADgANAAAIjAABCBxIsOBACggBKFzIEACFhxABSJwIgILFixgBaARQgIIECggiQIAQgIIEACgLEJgwYMIEABMmKABAk4IAAAAm6NRpIACAnxQoQCgwoWjRCA0AKKXAlEKCCVAFUABAlYJVqw4kDJiwgAKArwAoiB07YcIDBgDSqgVAoe2BCAQAyJ1LFwAFChAA6A0IADs=',
30:  'data:image/gif;base64,R0lGODdhDgAOAIQAAA4ODp6enl1dXUZGRiUlJYuLixMTE9XV1d/f3xwcHNHR0TMzMwUFBS4uLujo6Pb29vr6+vHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADgAOAAAIlAABCBxIsCDBChUAKFzIUGGFhxUASJw4sYLFixUAaNxYoILHjx4BiBSpgACFARQQSIgQoMIEAAAqVBAAgILNmw0WAABQoUKEAhSCBjUQAACACkgrFEhAoakEAw8AAKhAtQKECRSyCqgAoGvXCmArDKDAwEEFAGjTVlh7gAIFBwDiypVboYIEAgDy6t2bt0IEAIABBAQAOw==',
31:  'data:image/gif;base64,R0lGODdhDwAPAIQAAA4ODl1dXUZGRiUlJYuLixMTE9XV1d/f3xwcHNHR0TMzMwUFBS4uLujo6Pb29vr6+oaGhvHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADwAPAAAInwABCBxIsKBBABUAKFzIcGGFhwAiSpwIoIJFiwAyatRIoILHjxUAiBwJIMEACgIqHKjAEoBLlxUqAKBAU4KECBUqANhZoWcECkCDMmAwAUCFoxUIIKDAlEIBCgoASK1A9cEDClgpFHAAoGvXCmAnCKBAIUAFAGjTAqjAtgKFBQ0qAJhLl24FAxIgNADAt69fABUkDABAuLDhwhEAKF4cEAA7',
32:  'data:image/gif;base64,R0lGODdhDwAPAIQAAA4ODp6enl1dXUZGRiUlJYuLixMTE9/f3xwcHNHR0TMzMwUFBS4uLujo6Pb29vr6+vHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADwAPAAAIogABCBxIsKBBgRQAKFzIcCGFhwAiSpwIgIJFiwAyasyYoACFjyABiBxJgYKACRIGHKBAAYBLlxRiAgAwYcKBCBAoANhJoSeFAhOCTgAAIQAFAEgpKKWAYIJTpwwYSABAlQKFBxImaJ1gIIACAGDBUqAgYYLZCA4cAFjLloLbCQsWUKAAoK7duhQoRJjQAIDfv4ABUIhAAIDhw4gPQwDAuDGAgAA7',
33:  'data:image/gif;base64,R0lGODdhDgAOAIQAAA4ODp6enl1dXUZGRiUlJYuLixMTE9XV1d/f3xwcHNHR0TMzMwUFBS4uLujo6Pb29vr6+oaGhvHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADgAOAAAIlgABCBxIsKBBABYsAFjIsKGFhxYASJwoUUEBCxgxAtjI0YIFAQQoWBhpAYBJCygtAKgwYAACCxYAyLRA00KBCjgnWJBgAYBPC0ATVBhaAUAACwCSWlgKoYLTpw0sAJhqwQKFClgrGKiwgAKArxbCVqggYMKDBwDSqrVwoAIDBhYsAJhLd66FCREcANjLt68EAgACCwYQEAA7',
34:  'data:image/gif;base64,R0lGODdhDgANAIQAAA4ODp6enl1dXUZGRiUlJYuLixMTE9XV1d/f39HR0TMzMwUFBejo6Pb29vr6+oaGhvHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADgANAAAIlQABCBxIsKBBABQSAljIcGGCAhQiUgBAkSKFiwIIUNi4EYBHCiBBApgggYJJACgBUFgJYcKEAQgoUABAEwCFmwUm6IwQgQIFAEApUHDgYILRCQAgUADAFAAFChImSJUagAKAqwAoUBgwoasBAxMUSABAlgKFAxMWCIjQIIACAHDhUogwgQEFCgDy6s0LgcADAIADAwgIADs=',
35:  'data:image/gif;base64,R0lGODdhDgANAIQAAA4ODp6enl1dXUZGRiUlJYuLixMTE9XV1d/f39HR0TMzMwUFBejo6Pb29vr6+oaGhvHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADgANAAAIlQABCBxIsKBBABQSAljIcGGCAhQiUgBAkSKFiwIIUNi4EYBHCiBBApgggYJJACgBUFgJYcKEAQgoUABAEwCFmwUm6IwQgQIFAEApUHDgYILRCQAgUADAFAAFChImSJUagAKAqwAoUBgwoasBAxMUSABAlgKFAxMWCIjQIIACAHDhUogwgQEFCgDy6s0LgcADAIADAwgIADs=',
2:  'data:image/gif;base64,R0lGODdhDQAOAIQAAA4ODp6enl1dXUZGRiUlJYuLixMTE9XV1d/f3xwcHDMzMwUFBejo6Pb29vr6+oaGhvHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADQAOAAAImAABCBxIsKBACgASKlwIgIJDhwAiSoxIoSIFAQUKUADAkSOFjxAAEKBAkgIAABRSUigAYIIECjABAKBAwUGCCRMGUNhJAQAAChQkTBg6AQEFCgAAUDgwYcCEpxMiUKAAAACFCBOyZgUAgQIFAAAgEHiwQMCEsxAoAFi7lgEFChEMTAhAAYDdu3YbBFBAgQKAv4ADA5AAoHBAADs=',
3:  'data:image/gif;base64,R0lGODdhDgAOAIQAAA4ODp6enl1dXUZGRiUlJYuLixMTE9XV1d/f3xwcHNHR0TMzMwUFBS4uLujo6Pb29vr6+vHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADgAOAAAImAABCBxIsCDBChUAKFzIUGGFhxUASJw4sYJFiwoKANjIsYLHChEEEKhQAYBJkxUqQChAAQCFCjArAABQoeaEBBQoDKjAswIAABUODKBAlGiFowAAVJBAoalTBBWiAgAQgQAFBhSyUpBQoQKAr18dOBAggQKFCBUqAFjLtkIFAxQoBKgAoK5duw8CNKgAoK/fv30XTABAGEBAADs=',
4:  'data:image/gif;base64,R0lGODdhDwAPAIQAAA4ODl1dXUZGRiUlJYuLixMTE9XV1d/f3xwcHNHR0TMzMwUFBS4uLujo6Pb29vr6+oaGhvHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADwAPAAAIoQABCBxIsKBBABUAKFzIcGGFhwAiSpwIoIJFiwAyatRYoaPHBAQAiBwJoEKFBwQiABhQoQKAly8rVJjwAAGFmxVyAthZwUAFARSCUhBQoWgFABEkSKDAtGmFpxUASB0AYQGFqxQkHKhQAYBXrw0aBKBAVkKFCgDSqgVQoUKBAhQiVKgAoK5duw4oMKhQAYDfv4ABKGBQAYDhw4gPTwDAuHFAADs=',
5:  'data:image/gif;base64,R0lGODdhDwAPAIQAAA4ODp6enl1dXUZGRiUlJYuLixMTE9/f3xwcHNHR0TMzMwUFBS4uLujo6Pb29vr6+vHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADwAPAAAInwABCBxIsKBBgRQAKFzIcCGFhwAiSpwIgIJFiwAyasxIoaNHCgkAiBxJoeQDCgUACCgAoGVLCjAlSEAwAcAEChQA6IQQIcKEn0AlUBgKoCiBCQsmKFU6gIJTCgCiNlgwoeqEAwcoaAXAlSuFCBMmAIhAoSyAs2gpODAwAQIEChQAyJ0r10EABgEoANjLty8ABQwoABhMuDBhCQASKwYQEAA7',
6:  'data:image/gif;base64,R0lGODdhDgAOAIQAAA4ODl1dXUZGRiUlJYuLixMTE9XV1d/f39HR0TMzMwUFBS4uLujo6Pb29vr6+oaGhvHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADgAOAAAIkwABCBxIsKBBABQoAFjIsCGFhxQASJwokYLFixQAaNxIoaPHjggAiIRAwQAFCQ4IEAAQgACAlwMiTJhJc8IAChQA6HygYIJPnwIkUKAAoCgDBQEmKJ0ggIJTCgCiUogwoWqEAxSyUgDAlUKDAhMAUBhLAYDZsw0mTIAAgQIFAHDjwk2wgAIFAHjz6pVAAYDfvwACAgA7',
7:  'data:image/gif;base64,R0lGODdhDQAOAIQAAA4ODp6enl1dXUZGRiUlJYuLixMTE9XV1d/f39HR0TMzMwUFBejo6Pb29vr6+oaGhvHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADQAOAAAIjAABCBxIsKBBABQAKFy4kIJDhwAiRqRAsSJFABghUNhIwQGFjxQAiCQQ4cAACQ4KQKAgIAEAAA8myJw5AQCBAgByMlgwoadPChQACKUgYILRCQMkUFgKAACFCAYmTIiAgIJVCgCyNjAwAUAECmDBAhgbYEIACBTSUgDAlq0CBRTiAphLl64EAHjz4g0IADs=',
8:  'data:image/gif;base64,R0lGODdhDAAMAIQAAA4ODp6enl1dXUZGRiUlJYuLixMTE9XV1d/f3xwcHNHR0TMzMwUFBS4uLujo6Pb29vr6+oaGhvHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADAAMAAAIfAABCBxIsOBACwgRAgAgwYLDhw8BACAw4YAFCxAsaLQAAECEChUGUEhQQIIFCwAAOGBQoWVLAAIUAABgQUCFmzgrECgAAICFCRWCVhhAwYIFAAAeGKjAFIGFpxYAAAhQoQKACRayZgUAYEGDABIsiB0LAAAFC2gtAFi7NiAAOw==',
9:  'data:image/gif;base64,R0lGODlhCgAKAIQWAA4ODp6enl1dXUZGRiUlJYuLixMTE9XV1d/f3xwcHNHR0TMzMwUFBS4uLujo6Pb29vr6+oaGhvHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAABYALAAAAAAKAAoAAAhWACVYGEiQIIEJBywoXGghQoUKAyhAsEDRggMGFTImKCDBgkcBFUKGBCBAgYUJFVKqJFDggYEKMCsMoGDBQoAKFQBMQGChp4UFDQJIsEC0KAULSJMmDQgAOw==',
10:  'data:image/gif;base64,R0lGODdhDAAMAIQAAA4ODp6enl1dXUZGRiUlJYuLixMTE9XV1d/f3xwcHNHR0TMzMwUFBS4uLujo6Pb29vr6+oaGhvHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADAAMAAAIegABCBxIkKAECwgtAFjIEACBCQcsSJxoAQCACBUqDKBgoWNHAAAcMKhAEoKFkxYAALAgoILLBAUkWLAAwMKECjhzAhCgAMADAxWCCiVQAACAABUqAJhQYQAFCxYAAFjQIIAECwgsaLUAAAAFC2DDhgVAtiwAC2jRAggIADs=',
11:  'data:image/gif;base64,R0lGODdhDgANAIQAAA4ODp6enl1dXUZGRiUlJYuLixMTE9XV1d/f3xwcHDMzMwUFBejo6Pb29vr6+oaGhvHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADgANAAAIjAABCBxIsOBACBQoAFjIsCEAAhEOUJgIoKJFAAweTJhAoaNHACABUFgwYYAEBxRSpgTAkoKACTATUJhJAYDNBhEm6NRZAAIFCgCCBjAwoWhRAAAEUADAVMGECQAmTBgwgUABAFglUAgAAUIEBBQkUCgAoCwACmjTqgXAti0ACnDjAphLty4ACngB6A0IADs=',
12:  'data:image/gif;base64,R0lGODdhDgAOAIQAAA4ODp6enl1dXUZGRiUlJYuLixMTE9/f3xwcHNHR0TMzMwUFBS4uLujo6Pb29vr6+vHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADgAOAAAIkwABCBxIsCBBCBQAKFzIUCGBCBQoAJhIkWKDCRMoaKQAoKNHCg0WTBhAoSQFAChRUhAwoaWEBxRiUgAAwIGBCBNyIihAoScFAAACTBhKdAIEChQAAFDAYILTpwAEUKAAAIAECgEgRDgwYMAEAgkAiBVLoazZsgUAqF1Loa1bCgDiypVLoS4FAHjz6sVLgQKAvwACAgA7',
13:  'data:image/gif;base64,R0lGODdhDwAPAIQAAA4ODl1dXUZGRiUlJYuLixMTE9XV1d/f3xwcHNHR0TMzMwUFBS4uLujo6Pb29vr6+oaGhvHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADwAPAAAInwABCBxIsKBBABEAKFzIcOEACRUASJxIEUADCBIMVADAsWPHCg0WUKhAsgKAkygBVAhAgYKACRViApg500EBCjgpPHhQoSeAnwooFKBAlAICAhWSVgAwgQEDClCjRqhAFYDVChUiSJBAoSuAChUAiBVboeyBCgIoDEgAoK1bABXiyq1AAIDdu3cr6NULoK/fvwAqCAZAuLDhwhUAKF4cEAA7',
14:  'data:image/gif;base64,R0lGODdhDwAPAIQAAA4ODp6enl1dXUZGRiUlJYuLixMTE9/f3xwcHNHR0TMzMwUFBS4uLujo6Pb29vr6+vHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADwAPAAAIogABCBxIsKBBgRAAKFzIcCGBCBQASJxIEUCDCREoUADAsSNHChQWLJhAoSSAkygdOIgwoaUEChQAyJSpIICBCTgnSHhAgQKAnxIYMJhAlCgCCkgpAFhKIQAEABOiTihAoSoFAFgpQIhwYMIEAAAoiAVAliwFCgcGSJgggAIFAHDjUphLt0ACAHjz4qXAly+Av4ADA6BAGIDhw4gPUwDAuDGAgAA7',
15:  'data:image/gif;base64,R0lGODdhDgAOAIQAAA4ODl1dXUZGRiUlJYuLixMTE9XV1d/f39HR0TMzMwUFBS4uLujo6Pb29vr6+oaGhvHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADgAOAAAIlgABCBxIsKBBAAMgAFjIsCGDBxEoAJhIcSIFCgomTDBAAYDHjw0aRAgwYQKFkwBSSkgwocCElxMkUKAAoCaFBRNy6nRAoSeAnxQgAJhAdAIBCkgBKKUAgUKECVAJUJhKAYBVChQOCJgwAQCFrxQAiKVAloKEAQEoUADAti2Ft28JIABAty5dCngpANjLty8FCgACCwYQEAA7',
16:  'data:image/gif;base64,R0lGODdhDgANAIQAAA4ODp6enl1dXUZGRiUlJYuLixMTE9XV1d/f39HR0TMzMwUFBejo6Pb29vr6+oaGhvHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADgANAAAIlQABCBxIsKBBAA8IQADAsCFDChQYTIhAAYBFiwoCNIggYMGEAxQoABgpQcEEAwYmqBxAgQKAlwAoBJhAk6YEChQA6ARAAQKACUAnOHBAgQKAoxQoRIgwoWkBClABSAVAgQKCARMmQKDAFYBXABTCSpgAgIJZswDSUli7loAACnAByJVLoS6FAgkA6N2rl4JfAIADAwgIADs=',
17:  'data:image/gif;base64,R0lGODdhDAAMAIQAAA4ODp6enl1dXUZGRiUlJYuLixMTE9XV1d/f3xwcHNHR0TMzMwUFBS4uLujo6Pb29vr6+oaGhvHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADAAMAAAIhQABCBxIsOBACw4iEJAAAACFBQEeWBDAoMIECwAAWGhQwcCECiAPWAAAwEKACihRDrBgAQAACxIAVJhZgYIFCwAAWLAwoYLPCgkgWLAAAIAFCwgqKC1goSkAABaiDqgAQIKFqwAAWNhKoYIAC2AtAABgoawFAgosqLUAAICFtxYKAJg7NyAAOw==',
18:  'data:image/gif;base64,R0lGODlhCgAKAIQWAA4ODp6enl1dXUZGRiUlJYuLixMTE9XV1d/f3xwcHNHR0TMzMwUFBS4uLujo6Pb29vr6+oaGhvHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAABYALAAAAAAKAAoAAAhcACksCPDAggUHEQhIsNCggoEJAhhUmGDBQoAKGDMesGBBAoAKICsMsEDSwoQKKCtQsMDSAoIKMBNAsECT5oAKFQpY2MmTQgUAEiwIHWqBgAALSJMiLaDAglMLAQEAOw==',
19:  'data:image/gif;base64,R0lGODdhDAAMAIQAAA4ODp6enl1dXUZGRiUlJYuLixMTE9XV1d/f3xwcHNHR0TMzMwUFBS4uLujo6Pb29vr6+oaGhvHx8XR0dLm5uQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADAAMAAAIhAABCBxIkCCFBQEeWADAsCEACw0qGJhgwUEEAhIAALAQoIJHAQwqTLAAAIAFCQAqqFR5wAIAABYsTKhAs8IACxYAWLCAoIJPnxQsWABgoeiAChUSQLBgAQAAC1ApVKhQwIJVAAAsaLVAAIAEC2ABALBA1kIBARbSWgDAti0ABRbiWgAQEAA7'
};

//Planning - add options
var planeOptions = {
   A306 : ['Airbus', 'A306  -  A300F4-600', 470, 4150, []],
   A310 : ['Airbus', 'A310  -  A310-304', 480, 5100, []],
   A318 : ['Airbus', 'A318  -  A318-100', 460, 3100, []],
   A319 : ['Airbus', 'A319  -  A319-100', 450, 1800, []],
   A320 : ['Airbus', 'A320  -  A320-200', 450, 2700, []],
   A321 : ['Airbus', 'A321  -  A321-200', 450, 3300, []],
   A333 : ['Airbus', 'A333  -  A330-300', 475, 6100, []],
   A342 : ['Airbus', 'A342  -  A340-200', 490, 6700, []],
   A343 : ['Airbus', 'A343  -  A340-300', 490, 7400, []],
   A345 : ['Airbus', 'A345  -  A340-500', 480, 9000, []],
   A346 : ['Airbus', 'A346  -  A340-600', 480, 7900, []],
   A388 : ['Airbus', 'A388  -  A380-800', 520, 8500, []],
   AT72 : ['Other', 'AT72  -  ATR72-500', 275, 1500, []],
   B190 : ['Boeing', 'B190  -  B1900D', 280, 440, []],
   B350 : ['Boeing', 'B350  -  KINGAIR', 300, 1800, []],
   B463 : ['Boeing', 'B463  -  BAE-146', 426, 1800, []],
   B703 : ['Boeing', 'B703  -  B707-320B', 470, 5000, []],
   B712 : ['Boeing', 'B712  -  B717-200', 435, 2060, []],
   B722 : ['Boeing', 'B722  -  B727-200', 470, 2600, []],
   B732 : ['Boeing', 'B732  -  B737-200', 400, 1200, []],
   B733 : ['Boeing', 'B733  -  B737-300', 429, 1600, []],
   B734 : ['Boeing', 'B734  -  B737-400', 430, 2100, []],
   B735 : ['Boeing', 'B735  -  B737-500', 430, 1600, []],
   B736 : ['Boeing', 'B736  -  B737-600', 460, 3200, []],
   B737 : ['Boeing', 'B737  -  B737-700', 460, 2500, []],
   B738 : ['Boeing', 'B738  -  B737-800', 460, 2000, []],
   B739 : ['Boeing', 'B739  -  B737-900', 460, 2745, []],
   B744 : ['Boeing', 'B744  -  B747-400', 510, 7260, []],
   B748 : ['Boeing', 'B748  -  B747-8', 510, 8000, []],
   B752 : ['Boeing', 'B752  -  B757-200', 470, 3900, []],
   B753 : ['Boeing', 'B753  -  B757-300', 490, 3395, []],
   B763 : ['Boeing', 'B763  -  B767-300ER', 460, 6105, []],
   B764 : ['Boeing', 'B764  -  B767-400ER', 460, 5645, []],
   B772 : ['Boeing', 'B772  -  B777-200ER', 480, 5240, []],
   B788 : ['Boeing', 'B788  -  B787-800', 490, 7850, []],
   B789 : ['Boeing', 'B789  -  B787-900', 490, 8300, []],
   BE20 : ['Other', 'BE20  -  KINGAIR', 260, 1600, []],
   C172 : ['Cessna', 'C172  -  CESSNA 172R', 114, 580, []],
   C208 : ['Cessna', 'C208  -  CESSNA 208', 184, 940, []],
   C404 : ['Cessna', 'C404  -  C404 TITAN', 220, 550, []],
   C510 : ['Cessna', 'C510  -  C510 MUSTANG', 340, 1300, []],
   C550 : ['Cessna', 'C550  -  CITATION', 384, 1900, []],
   C750 : ['Cessna', 'C750  -  CITATION X', 550, 3250, []],
   CRJ2 : ['Bombardier', 'CRJ2  -  CRJ-200', 420, 1340, []],
   CRJ7 : ['Bombardier', 'CRJ7  -  CRJ-700', 442, 1430, []],
   CRJ9 : ['Bombardier', 'CRJ9  -  CRJ-900', 458, 1600, []],
   DC10 : ['Other', 'DC10  -  DC-10-30', 510, 6220, []],
   DC6  : ['Other', 'DC6  -  DC-6', 265, 3980, []],
   DH8A : ['Bombardier', 'DH8A  -  DHC8-102', 240, 970, []],
   DH8B : ['Bombardier', 'DH8B  -  DHC8-200', 270, 1100, []],
   DH8C : ['Bombardier', 'DH8C  -  DHC8-311', 220, 1950, []],
   DH8D : ['Bombardier', 'DH8D  -  DHC8-402', 360, 1290, []],
   DHC2 : ['Bombardier', 'DHC2  -  BEAVER', 109, 670, []],
   DHC6 : ['Bombardier', 'DHC6  -  TWIN OTTER', 180, 900, []],
   E135 : ['Embraer', 'E135  -  ERJ-135LR', 450, 1480, []],
   E145 : ['Embraer', 'E145  -  EMB-145LR', 450, 1200, []],
   E170 : ['Embraer', 'E170  -  EMB-170', 460, 2100, []],
   E175 : ['Embraer', 'E175  -  EMB-175', 460, 2100, []],
   E190 : ['Embraer', 'E190  -  EMB-190', 460, 1850, []],
   E195 : ['Embraer', 'E195  -  EMB-195', 450, 1600, []],
   F50  : ['Other', '50  -  FOKKER F50', 240, 1500, []],
   GLF4 : ['Other', 'GLF4  -  GULFSTREAM', 450, 4600, []],
   H25B : ['Other', 'H25B  -  HAWKER 800A', 463, 3000, []],
   JS41 : ['Other', 'JS41  -  BAE JS-41', 290, 1000, []],
   L101 : ['Other', 'L101  -  L1011-500', 480, 4360, []],
   LJ45 : ['Other', 'LJ45  -  LEAR 45', 457, 2098, []],
   MD11 : ['MD', 'MD11  -  MD-11', 500, 7100, []],
   MD82 : ['MD', 'MD82  -  DC-9-82', 440, 2052, []],
   MD83 : ['MD', 'MD83  -  DC-9-83', 440, 2504, []],
   MD88 : ['MD', 'MD88  -  MD-88', 450, 2055, []],
   MD90 : ['MD', 'MD90  -  MD-90-30', 440, 2200, []],
   RJ85 : ['Other', 'RJ85  -  AVRO RJ85', 420, 1100, []],
   SF34 : ['Other', 'SF34  -  SAAB 340B', 280, 1310, []],
   SW4  : ['Other', 'SW4  -  METROLINER', 270, 575, []],
   T154 : ['Other', 'T154  -  TU-154B2', 475, 1700, []]};
//This will hold Google map markers for planning purposes
var planningRoutes = [];
//holds old zoom/center location, so after hovering on planning table, it can zoom back to old position
var planningOldZoom =  {center: null, zoom: null};;

// execute when the DOM is fully loaded
$(document).ready(function() {
    // styles for map
    // https://developers.google.com/maps/documentation/javascript/styling
    var styles = [

        // hide Google's labels
        {
            featureType: "all",
            elementType: "labels",
            stylers: [{
                visibility: "off"
            }]
        },

        // hide roads
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [{
                visibility: "off"
            }]
        },

        {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{
                color: '#17263c'
            }]
        },
        {
            featureType: 'poi',
            elementType: 'geometry',
            stylers: [{
                color: '#fff'
            }]
        }
    ];

    // options for map
    // https://developers.google.com/maps/documentation/javascript/reference#MapOptions
    var options = {
        center: {
            lat: 0,
            lng: 0
        }, // Stanford, California
        disableDefaultUI: true,
        mapTypeId: google.maps.MapTypeId.TERRAIN,
        maxZoom: 14,
        panControl: true,
        styles: styles,
        zoom: 3,
        zoomControl: true
    };

    // get DOM node in which map will be instantiated
    var canvas = $("#map-canvas").get(0);

    // instantiate map
    map = new google.maps.Map(canvas, options);

    // configure UI once Google Map is idle (i.e., loaded)
    google.maps.event.addListenerOnce(map, "idle", configure);

    //Try hide show
    $(".content-div").hide();
    $(".content-div#home").show();
    $(".content-buttons#home").addClass("active");

    $(".content-buttons").on("click", function() {
        $(".content-buttons").removeClass("active");
        $(this).addClass("active");

        $(".content-div").fadeOut('fast');
        $(".content-div#" + this.id).fadeIn('fast');

    });

    //Make sure the map stays put when scrolling page
    // $(window).scroll(function() {
    //   $("#map-canvas").css('top', $(window).scrollTop() + 65 + 'px');
    // });

    //Charting function for plotting speed and altiitude vs time
    google.charts.load('current', {packages: ['corechart', 'line']});

    //show hide ATC and Pilots on ONLINE page
    $('.showHideATC').on('click', function () {
        $('.showHideATC').toggle();
        $('#tablefilterATC').fadeToggle('fast');
    });

    $('.showHidePilot').on('click', function () {
        $('.showHidePilot').toggle();
        $('#tablefilterpilot').fadeToggle('fast');
    });

    $("#filtertext").on("keyup", function() {
        //Filter the list with the current value of the textbox
        filterOnlines($("#filtertext").val());
    });

    //Preferences
    $("#showplanes").on("click", function() {
        for (var i = 0; i < planes.length; i++) {
            if (this.checked) {
                planes[i].setMap(map);
            } else {
                planes[i].setMap(null);
            }
        }
    });

    //METAR textbox
    $("#metarquery").keyup(function(event){
        if(event.keyCode == 13){
            get_metar($("#metarquery").val());
        }
        if ($("#metarquery").val() === '') {
            $("#metardetails").hide();
        }
    });


    //Get worst weather when weather is clicked
    $("#wx").on('click', function() {
       console.log(updateWorstWeather());
       //TO--DO: fix this thing later
    });

    //Planning range bar range update and text update
    $("#planningrangebar").on("change", function() {
        //Determine hours
        var hrs = Math.floor($(this).val() / 60);
        var hrsUnit = hrs === 1 ? ' hour' : ' hours';
        var hrsText = hrs === 0 ? '' : hrs + hrsUnit + ' ';

        var min = Math.round(($(this).val() / 60 % 1) * 60);
        var minUnit = min === 1 ? ' minute' : ' minutes';
        var minText = min === 0 ? '' : min + minUnit;
        $("#planningrangevalue").text(hrsText + minText + ' or less');

        //Figure out which planes can do this!
        planFlight($(this).val());
    });

    //populate plane options in planning tab
    var planesWritten = [];
    var tmp = '<option value=\'None\'></option>';
    for (var plane in planeOptions) {

        if (planesWritten.indexOf(planeOptions[plane][0]) === -1) {
            tmp += "<option value='" + planeOptions[plane][0] + "'>" + planeOptions[plane][0] + "</option>";
            planesWritten.push(planeOptions[plane][0]);
        }
    }
    $("#planningplanes").html(tmp);

    $("#planningplanes").on("change", function() {
        planFlight();
    });
});

//Add listener for global mouse position; used to display hover window next to mouse
$(document).on('mousemove', function(event) {
    mouseX = event.pageX;
    mouseY = event.pageY;

});


//Called for each airplane. Throws up airplanes on the map
function addPlane(data) {
    //create latitude and longitude
    var lls = new google.maps.LatLng(parseFloat(data["latitude"]), parseFloat(data["longitude"]));

    //var image = "http://wz5.resources.weatherzone.com.au/images/widgets/nav_trend_steady.gif";

    var image = imgs[(Math.round(data["heading"] / 10) % 36).toString()]; //"http://abid.a2hosted.com/plane" + Math.round(data["heading"] / 10) % 36 + ".gif";
    //create the marker, attach to map
    var m = new google.maps.Marker({
        position: lls,
        map: map,
        icon: image
    });

    m.addListener('click', function() {
        //if clicked then show info
        hideHoverWindow();
        selected_plane = data["id"];
        showSelectedInfo();
    });


    m.addListener('mouseover', function() {
        //only if no airport is clicked upon, then show the hover for this
        showHoverWindow(prettifyPlaneData(data));

        //Get origin and destination locations
        for (var j = 0; j < latest_json[0].length; j++) {
            if (latest_json[0][j]["id"] === data["depairport_id"]) {
                d_coord = {lat: latest_json[0][j]["latitude"], lng: latest_json[0][j]["longitude"]};
            }
            if (latest_json[0][j]["id"] === data["arrairport_id"]) {
                a_coord = {lat: latest_json[0][j]["latitude"], lng: latest_json[0][j]["longitude"]};
            }
        }
        //Current plane position
        var plane_coord = {
            lat: parseFloat(data["latitude"]),
            lng: parseFloat(data["longitude"])
        };
        var flightPlanCoordinates = [d_coord];

        for (var j = 0; j < data["detailedroute"].length; j++) {
            var tmppush = {
                lat: parseFloat(data["detailedroute"][j][1]),
                lng: parseFloat(data["detailedroute"][j][2])
            };

            var added_plane = false;
            //See if plane is in a box from prev location to curr location
            //if so, a line to it should be drawn
            var prev_point_lat = flightPlanCoordinates[flightPlanCoordinates.length - 1]['lat'];
            var prev_point_lng = flightPlanCoordinates[flightPlanCoordinates.length - 1]['lng'];
            var curr_point_lat = tmppush['lat'];
            var curr_point_lng = tmppush['lng'];

            //Define Bounding Box, we will check if plane is within this box!
            var latLogBox = {
                ix : (Math.min(prev_point_lng, curr_point_lng)) - 0,
                iy : (Math.max(prev_point_lat, curr_point_lat)) + 0,
                ax : (Math.max(prev_point_lng, curr_point_lng)) + 0,
                ay : (Math.min(prev_point_lat, curr_point_lat)) - 0
            };

            if ((plane_coord.lat <= latLogBox.iy && plane_coord.lat >= latLogBox.ay) && (latLogBox.ix <= plane_coord.lng && plane_coord.lng <= latLogBox.ax) && added_plane === false) {
                //Plane is within bounds, let try pushing it
                added_plane = true;
                flightPlanCoordinates.push(plane_coord);
            }
            flightPlanCoordinates.push(tmppush);
        }

        //add arrival airport coordinates
        flightPlanCoordinates.push(a_coord);


        flightPath = new google.maps.Polyline({
            path: flightPlanCoordinates,
            geodesic: false,
            strokeColor: '#0000FF',
            strokeOpacity: 1.0,
            strokeWeight: 2,
            map: map
        });
    });

    m.addListener('mouseout', function() {
        //if nothing has been clicked on, then hide the info window (ALSO SEE CONFIGURE FUNCTION FOR CLICK EVENT LISTERNERS!)
        flightPath.setMap(null);
        $(".hoverwindow").css("display", "none");
    });
    //add current marker to airports array
    planes.push(m);

    //Update online table
    $("#tablefilterpilot tbody").append("<tr><td class='hidden'>" + data['id'] + "</td><td class='hidden'>" + data['airline_name'] + "</td><td><a href=\"#\" onclick=\"centerMap("+data['id']+", 2)\">"+data['callsign']+"</a></td><td>"+data['real_name']+"</td><td>"+data['depairport']+"</td><td>"+data['arrairport']+"</td></tr>");
}



function addATCMarker(type, latitude, longitude, airportID, icao, name) {
    //This function adds a marker of the given size at the given latitude and longitude
    //Type definitions are as defined in the backend (0 for ATIS, 1 CLNC, etc.)
    //For radii of circles
    if (type === 5 || type === 6) {
        return;
    }
    var radii = {
        //ATC Type: [Raduis of circle, color of circle]
        0: [18000, "#cccc00"],
        1: [55000, "#0066ff"],
        2: [75000, "#009933"],
        3: [100000, "#ff0000"],
        4: [175000, "#9933ff"],
        5: [0, "#fff"],
        6: [0, "#fff"]
    };

//TO--DO: add logic for adding centres

    var Circle = new google.maps.Circle({
        strokeColor: radii[type][1],
        strokeOpacity: 1,
        strokeWeight: 2.5,
        fillColor: radii[type][1],
        fillOpacity: 0.45,
        map: map,
        center: {lat: latitude, lng: longitude},
        radius: radii[type][0],
        //Base is for our purposes
        baseSize: radii[type][0]
    });
    //Add airport to circle

    Circle.addListener('click', function(){
        //if clicked then show info
        hideHoverWindow();
        selected_airport = airportID;
        showSelectedInfo();
    });

    Circle.addListener('mousemove', function() {
        showHoverWindow(prettifyAirportData({'icao': icao, 'name': name}));
    });

    Circle.addListener('mouseout', function() {
       $(".hoverwindow").css("display", "none");
    });

    airportCircles.push(Circle);
}

//called as JSON is being parsed; this adds polygon for Center on map
function addCenter(data) {
    var tmp_coords = [];

    if (data['coordinates'] === null) {
        return;
    }

//    for (var i = 0; i < 3; i++) {
//        tmp_coords.push({lat: parseFloat(data['coordinates'][i][1]), lng: parseFloat(data['coordinates'][i][0])});
//    }
    data['coordinates'].forEach(function(val) {
//        console.log(parseFloat(val[0]) + '   ' + parseFloat(val[1]));
//        var lls = new google.maps.LatLng(, );
        tmp_coords.push({lat: parseFloat(val[1]), lng: parseFloat(val[0])});
    });
//    tmp_coords.push(tmp_coords[0]);
//    console.log(tmp_coords)
//    tmp_coords = [{lat: 49, lng: -123}, {lat: 30, lng: -123}, {lat: 30, lng: -90}]

    //Create polygon
    var m = new google.maps.Polygon({
        paths: tmp_coords,
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.35,
        zIndex: -100
    });

    m.addListener('click', function(){
        hideHoverWindow();
        selected_center = data['id'];
        showSelectedInfo();
    });

    m.addListener('mousemove', function() {
        showHoverWindow(prettifyCenterData(data));
    });

    m.addListener('mouseout', function() {
       $(".hoverwindow").css("display", "none");
    });

    m.setMap(map);
    centers.push(m);
}


//called as JSON data is being parsed, to add marker to map
function addAirport(data) {
    //There is one special airport - for thjose planes with no arrival or departure. In this case, ignore it (don't draw on map)
    if (data['longitude'] === 0 && data['latitude'] === 0) {//&& data['name'] === null) {
        return;
    }
    //create latitude and longitude
    var lls = new google.maps.LatLng(parseFloat(data["latitude"]), parseFloat(data["longitude"]));
    var image = "http://conferences.shrm.org/sites/all/themes/sessions/images/dot76923C.png";

    if (data["atc"].length !== 0) {
        //There is ATC so lets draw circles!
        for (var i = data["atc_pic"].length - 1; i > -1; i--) {
                addATCMarker(data["atc_pic"][i], data['latitude'], data['longitude'], data['id'], data['icao'], data['name']);
        }
    }
    //Loop through each ATC and add to online table
    data['atc'].forEach(function(val) {
        //Update online table
        $("#tablefilterATC tbody").append("<tr><td class='hidden'>" + data['id'] +  "</td><td><a href='#' onclick='centerMap("+data['id']+",0);'>"+data['name']+"</a></td><td>"+val['callsign']+"</td><td>"+val['freq']+"</td><td>"+val['name']+"</td></tr>");
    });

    //create the marker, attach to map
    var m = new google.maps.Marker({
        position: lls,
        map: map,
        icon: image
    });

    //Expected behavior: hover over marker ==> show window. Hover out ==> hide info window. Click on marker ==> show window until clicked elsewhere
    m.addListener('click', function() {
        //if clicked then show info
        hideHoverWindow();
        selected_airport = data["id"];
        showSelectedInfo();
    });

    m.addListener('mouseover', function() {
    //only if no airport is clicked upon, then show the hover for this
        showHoverWindow(prettifyAirportData(data));

        //Draw lines
        var coord, flightPlanCoordinates;
        for (var i = 0, deplen = data["depplanes"].length; i < deplen; i++) {
            //create marker
            for (var j = 0; j < latest_json[2].length; j++) {
                if (latest_json[2][j]["id"] === data["depplanes"][i]) {
                    coord = {
                        lat: latest_json[2][j]["latitude"],
                        lng: latest_json[2][j]["longitude"]
                    };
                }
            }

            flightPlanCoordinates = [{
                    lat: data["latitude"],
                    lng: data["longitude"]
                },
                coord
            ];

            var flightPath = new google.maps.Polyline({
                path: flightPlanCoordinates,
                geodesic: true,
                strokeColor: '#FF000',
                strokeOpacity: 1.0,
                strokeWeight: 2,
                map: map
            });

            airportLines.push(flightPath);
        }

        for (var i = 0, arrlen = data["arrplanes"].length; i < arrlen; i++) {
            //create marker
            for (var j = 0; j < latest_json[2].length; j++) {
                if (latest_json[2][j]["id"] === data["arrplanes"][i]) {
                    coord = {
                        lat: latest_json[2][j]["latitude"],
                        lng: latest_json[2][j]["longitude"]
                    };
                }
            }

            flightPlanCoordinates = [{
                    lat: data["latitude"],
                    lng: data["longitude"]
                },
                coord
            ];

            flightPath = new google.maps.Polyline({
                path: flightPlanCoordinates,
                geodesic: true,
                strokeColor: '#FF000',
                strokeOpacity: 1.0,
                strokeWeight: 2,
                map: map
            });

            airportLines.push(flightPath);
        }

    });

    m.addListener('mouseout', function() {
        //if nothing has been clicked on, then hide the info window (ALSO SEE CONFIGURE FUNCTION FOR CLICK EVENT LISTERNERS!)
        $(".hoverwindow").css("display", "none");

        //Hide all airport lines
        for (var i = 0; i < airportLines.length; i++) {
            airportLines[i].setMap(null);
        }
        airportLines = [];
    });

    //add current marker to airports array
    airports.push(m);
}


function centerMap(id, type) {
    //Centers the map on something with the ID supplied; loops through latest_json's type'th index
    //loop through the latest json to find the plane first
    for (var i = 0; i < latest_json[type].length; i++) {
        if (latest_json[type][i]['id'] === id) {
            //Found the plane in question, lets center the map onto it!
            map.setZoom(8);
            map.setCenter(new google.maps.LatLng(parseFloat(latest_json[type][i]['latitude']), parseFloat(latest_json[type][i]['longitude'])));
        }
    }
}

function prettifyPlaneData(data) {
    //Returns displayable HTML for info window
    var depair = data['depairport'] === '' ? 'None' : data['depairport'];
    var arrair = data['arrairport'] === '' ? 'None' : data['arrairport'];
    var x = "<h1 class='text-center text-larger'>" + data["callsign"] + "</h1>" + "<p>" + depair;
    x += " <img class='planelogosmall' src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAMAAAD04JH5AAAAA3NCSVQICAjb4U/gAAAACXBIWXMAAAN5AAADeQELGyzWAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAR1QTFRF////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADGXzGQAAAF50Uk5TAAMFBwkKDBATFBkaHyAlJicoKissLzA5P0BBQkVGR01OT1BbXF9gYWhvcHN0d3+AgYKDhI6PkJien6ChpK2vsLy9vr/Awc7P0NjZ2tze3+Dh5Onq6+zt9fb4+fz9/s9AlesAAAKbSURBVHja7ZvXUgMxDEUJvffQO4RO6ITQIfTeO/v/nwEkQNYbO3icQQdmuO/aOQPWjSxLeXn/+hsa2vepHwAIez7dlAEEJ36CZQBg3g/gtcsDtCgARwXiAKFrhWBK/k8QVwAe68QBehUAb1scoPBOJRgSJ1hTAeTNIKICyJtB6VOAQNwMEgGAQ2kzGAkAiJtBZRBA3Az2ggTSZhANAkibQTgDQNoMTjMIlsiiIKk2sCgAzCB0k0kwCRYFKTOoBYuCpBJkUZDUIFgUyJtBRAMgagYZRYG4GSR0AJJmMKIDkDSDKi3Ag6AZ7GkJBM0gqgUQNIOwHkDQDE71BHExgAU9gNcqBdBqADiQMgNdUZBU1LH/NfyhbtuIJQOAoxlsfsa/dFlG9BkAvC0ngPGv+KsKu4iiexNBxAWgIR2/E7ILWTcBXJe6EJynPzBrFzFoAnAzg1g6/qUzh6LA2Qz8hablMdg2AriYQfGj/75rdQxGjQBOZrDp/8CMe1GQMoOaXBLxTc8dNiH7ZgIHM6hXPnBZbhEyaQZwMYNztbixOAZNWQAczCCmfmHaIuQsC0E8p0R8PwaLsW917GUj+D5+bqDalIhiup3J/yLY8BDtNn4CjDEA3kOHNhEFdVGiTURBregTUVDNKYAeDGCCTMR3rbKJ+HYMfwkA/i/ADyGehrQR4VaM/xjRP8d4QYKXZHhRSpfl+MUEv5rRl1P8eo43KPAWDd2kwtt0eKMSb9XizWq8Xf/3HizwJxv60Qp/tsMfLumnW/zxGn++pwcY8BEOfIiFHuPBB5nwUS56mA0f58MHGvGRTnqoFR/rxQeb6dFufLgdH++nFxzwFQ98yYVe88EXnfBVL3rZDV/3wxce8ZVPeukVX/vFF5//9XN6Baqm1LuueiTlAAAAAElFTkSuQmCC' alt=''> ";
    x += arrair + "</p>";
    return x;
}

function prettifyCenterData(data) {
    //Returns displayable HTML for info window
    return "<h1 class='text-center text-larger'>" + data['icao'] + " Center</h4>";
}

function prettifyAirportData(data) {
    //Returns displayable HTML for info window
    return "<h1 class='text-center text-larger'>" + data['icao'] + "</h4> <p>" + data["name"] + "</p>";
}

function metarLink(metar) {
    //Used for airports, wherein it gets auxiliary function to fetch METAR link and then
    //switches focus to metar tab
    get_metar(metar);
    $("#metarquery").val(metar);
    $(".content-buttons").removeClass("active");
    $('#wx').addClass("active");
    $(".content-div").fadeOut('fast');
    $(".content-div#wx").fadeIn('fast');


}

function showSelectedInfo() {
    ///This function writes the currently selected airplane or airport's iforation to the main tab!
    //Update the airplane data from JSON
    update();

    //if an airport is selected, then ship its data out
    if (selected_airport !== -1) {
        $("#selectedairport").show();
        $("#arrdeptable").show();
        $("#selectedplane").hide();

        //show the div containing data
        $("#selectedairport").css("display", "block");
        //Make loiading gif visible
//        $("#loadinggif").show();
        var selectedlat, selectedlon;
        //Loop through local JSON cache
        for (var j = 0, l = latest_json[0].length; j < l; j++) {
            if (latest_json[0][j]["id"] === selected_airport) {
                $("#poitext").text(latest_json[0][j]['icao']);
                var a = latest_json[0][j]['name'] + '<br/>Altitude: ' + latest_json[0][j]['altitude'] + ' ft';
                a = a + '<br/>Get METAR for <a href = "#" onclick="metarLink(\'' + latest_json[0][j]['icao'] + '\')">' + latest_json[0][j]['icao'] + '</a>';
                $("#help").html(a);

                //Set latitude and longitude
                selectedlat = latest_json[0][j]['latitude'];
                selectedlon = latest_json[0][j]['longitude'];
                selectedalt = latest_json[0][j]['altitude'];

                //Populate ATC information
                var atc_html = "";
                if (latest_json[0][j]['atc'].length === 0) {
                    atc_html = "<h5>No ATC online</h5>";
                } else {
                    var tmp = latest_json[0][j]['atc'];
                    tmp.forEach(function(val) {
                        atc_html += "<h5>" + val['callsign'] + "</h5>";
                        atc_html += "<p><strong>Frequency</strong>: " + val['freq'] + "</p>";
                        atc_html += "<p><strong>Name and ID</strong>: " + val['name'] + " (CID " + val['cid'] + ")</p>";
                        atc_html += "<p><strong>Message</strong>: " + val['atismsg'] + "</p>";
                        atc_html += "<p><strong>Logon Time</strong>: " + humanizeTime(val['timelogon']) + "</p>";

                    });
                }
                $("#selectedatcdata").html(atc_html);

                //NOW, lETS LOOK FOR PLANE DATA LOCALLY
                var departures = latest_json[0][j]['depplanes'];
                var arrivals = latest_json[0][j]['arrplanes'];
                break;
            }
        }

        var depCount = 0;
        $('#selecteddepartures tbody').html("");
        var arrCount = 0;
        $('#selectedarrivals tbody').html("");

        for (var j = 0, l = latest_json[2].length; j < l; j++) {
            //distance for current airplane from airport (really only used if in departures or arrivals array)
            var dist = parseInt(distance(parseFloat(latest_json[2][j]['longitude']), parseFloat(latest_json[2][j]['latitude']), parseFloat(selectedlon), parseFloat(selectedlat)));

                var tmpSpeed = latest_json[2][j]['speed'];
                var tmpPlaneAlt = latest_json[2][j]['altitude'];
                var selectedalt = latest_json[2][j]['altitude'];
                var status;

            //Calculate status
            if (dist < 20 && tmpSpeed === 0 && Math.abs(selectedalt - tmpPlaneAlt) < 50) {
                status = "In terminal";
            } else if (dist < 20 && tmpSpeed > 0 && Math.abs(selectedalt - tmpPlaneAlt) < 50) {
                status = "Taxiing";
            } else if (dist > 20 && dist < 120) {
                //distance is nearby (imminently arriving/departing)
                status = "*";
            } else if (dist > 100 && tmpSpeed === 0) {
                status = "*2";
            } else {
                status = "Enroute";
            }

            //Find arrivals and departures
            if ($.inArray(latest_json[2][j]['id'], departures) !== -1) {
                if (status === "*") {
                    status = "Departing";
                } else if (status === "*2") {
                    status = "Arrived";
                }
                //Write the departures
                tmp = '<td><a href="#" onclick="centerMap(' + latest_json[2][j]['id'] + ', 2)">';
                tmp += latest_json[2][j]['callsign'] + "</a></td>";
                //tmp += "<td>" + latest_json[2][j]['deptime'] + "</td>";
                tmp += "<td>" + latest_json[2][j]['arrairport'] + "</td>";
                tmp += "<td>" + latest_json[2][j]['altitude'] + "</td>";
                tmp += "<td>" + latest_json[2][j]['speed'] + " </td>";
                //  tmp += "<td>" + latest_json[2][j]['heading'] + "</td>";
                //   tmp += "<td>" + latest_json[2][j]['aircraft'] + "</td>";
                tmp += "<td>" + status + "</td>";

                $('#selecteddepartures tbody').append("<tr>" + tmp + "</tr>");

                depCount++;

            }
            if ($.inArray(latest_json[2][j]['id'], arrivals) !== -1) {
                if (status === "*") {
                    status = "Arriving";
                } else if (status === "*2") {
                    status = "Not yet departed";
                }

                tmp = '<td><a href="#" onclick = "centerMap(' + latest_json[2][j]['id'] + ', 2)">';
                tmp += latest_json[2][j]['callsign'] + "</a></td>";
                tmp += "<td>" + latest_json[2][j]['depairport'] + "</td>";
                tmp += "<td>" + dist + "</td>";
                tmp += "<td>" + latest_json[2][j]['altitude'] + "</td>";
                tmp += "<td>" + status + " </td>";

                $('#selectedarrivals tbody').append("<tr>" + tmp + "</tr>");
                arrCount++;
            }
        }

            if (depCount === 0) {
                $('#selecteddepartures tbody').html("<tr><td colspan = '8'>No scheduled departures</td></tr>");
            }
            if (arrCount === 0) {
                $('#selectedarrivals tbody').html("<tr><td colspan = '8'>No scheduled arrivals</td></tr>");
            }

    } else if (selected_center !== -1) {
        $("#selectedairport").show();
        $("#arrdeptable").hide();
        $("#selectedplane").hide();

        //ICAO, range,
        //message, callsing, name, CID, frequecy, time logon, range

        //show the div containing data
        $("#selectedairport").css("display", "block");

        //Loop through local JSON cache
        for (var j = 0, l = latest_json[1].length; j < l; j++) {
            if (latest_json[1][j]["id"] === selected_center) {
                $("#poitext").text(latest_json[1][j]['icao'] + ' Center');
                $("#help").text("");
                //Populate ATC information
                atc_html = "";
                tmp = latest_json[1][j]['atc'];
                tmp.forEach(function(val) {
                    atc_html += "<h5>" + val['callsign'] + "</h5>";
                    atc_html += "<p><strong>Frequency</strong>: " + val['freq'] + "</p>";
                    atc_html += "<p><strong>Name and ID</strong>: " + val['name'] + " (CID " + val['cid'] + ")</p>";
                    atc_html += "<p><strong>Message</strong>: " + val['atismsg'] + "</p>";
                    atc_html += "<p><strong>Logon Time</strong>: " + humanizeTime(val['timelogon']) + "</p>";
                    });
            }
            $("#selectedatcdata").html(atc_html);
        }
    } else if (selected_plane !== -1) {
        $("#selectedairport").hide();
        $("#arrdeptable").hide();
        $("#selectedplane").show();

        for (var j = 0, l = latest_json[2].length; j < l; j++) {
            if (latest_json[2][j]["id"] === selected_plane) {
                $("#poitext").text(latest_json[2][j]['callsign']);
                $("#help").text("");

                //Found the plane, lets build up data
                $("#selectedplaneleft .deparricao").html(latest_json[2][j]["depairport"]);
                // $("#selectedplaneleft .deparrtime").html(latest_json[2][j]["deptime"]);
                $("#selectedplaneright .deparricao").html(latest_json[2][j]["arrairport"]);
                //latitude and long for arriving departing airpott
                var arrlong, arrlat, deplong, deplat;
                //Find the airport for its name
                for (var k = 0; k < latest_json[0].length; k++) {
                    if (latest_json[0][k]['id'] === latest_json[2][j]['depairport_id']) {
                        //found the departure airport
                        if (latest_json[0][k]['name'] !== null) {
                            $("#selectedplaneleft .deparrname").text(latest_json[0][k]['name']);
                        }
                        arrlong = parseFloat(latest_json[0][k]['longitude']);
                        arrlat = parseFloat(latest_json[0][k]['latitude']);
                    } else if (latest_json[0][k]['id'] === latest_json[2][j]['arrairport_id']) {
                        //found the arrival airport
                        if (latest_json[0][k]['name'] !== null) {
                            $("#selectedplaneright .deparrname").text(latest_json[0][k]['name']);
                        }
                        deplong = parseFloat(latest_json[0][k]['longitude']);
                        deplat = parseFloat(latest_json[0][k]['latitude']);
                    }
                }
                //plane longitude/lat    distance travelled and left
                var plong = parseFloat(latest_json[2][j]['longitude']);
                var plat = parseFloat(latest_json[2][j]['latitude']);
                var dist_trav = distance(deplong, deplat, plong, plat);
                var dist_left = distance(plong, plat, arrlong, arrlat);

                //update the progress bar
                $(".selectedprog").css("width", dist_left / (dist_trav + dist_left)*100 + "%");

                $(".selectedprogbar span").text(Math.round(dist_left) + ' / ' + Math.round(dist_trav + dist_left) + ' km flown');

                $("#selectedalt").html('<span>Alternate Airport:</span> ' + latest_json[2][j]['altairport']);
                $("#selectedaircraft").html('<span>Aircraft:</span> ' + latest_json[2][j]['aircraft']);
                $("#selectedairline").html('<span>Airline Name:</span> ' + latest_json[2][j]['airline_name']);
                $("#selectedairlinecountry").html('<span>Airline Country:</span> ' + latest_json[2][j]['airline_country']);

                $("#selectedheading").html('<span>Heading:</span> ' + latest_json[2][j]['heading']);
                $("#selectedspeed").html('<span>Speed:</span> ' + latest_json[2][j]['speed'] + 'kts (' + latest_json[2][j]['tascruise'] + ' kts planned)');
                $("#selectedaltitude").html('<span>Altitude:</span> ' + latest_json[2][j]['altitude'] + ' ft (planned ' + latest_json[2][j]['plannedaltitude'] + ' ft)');
                $("#selectedroute").html('<span>Route:</span></br> ' + latest_json[2][j]['route']);
                $("#selectedposition").html('<span>Current Position:</span> ' + latest_json[2][j]['latitude'] + ', ' + latest_json[2][j]['longitude']);
//                $("#selectedflyingover").html('<span>Current Position:</span> ' + latest_json[2][j]['current_country']);
                $("#selectedflighttype").html('<span>Flight Type:</span> ' + (latest_json[2][j]['flighttype'] === 'V' ? 'VFR' : 'IFR'));
                $("#selecteddeparturetime").html('<span>Departure Time:</span> ' + latest_json[2][j]['deptime']);

                $("#selectedpilotcid").html('<span>Pilot ID / Name:</span> ' + latest_json[2][j]['cid'] + ' ' + latest_json[2][j]['real_name']);
                $("#selectedpilotlogontime").html('<span>Pilot Logon Time</span> ' + humanizeTime(latest_json[2][j]['timelogon']));
                $("#selectedpilotremarks").html('<span>Remarks</span> ' + latest_json[2][j]['remarks']);

                //Set voice or text only method (based on remarks from vatsim)
                if (latest_json[2][j]["remarks"].indexOf('/v') != -1) {
                    //Voice enabled!
                    $("#selectedcommmic").show();
                    $("#selectedcommtext").hide();
                } else {
                    $("#selectedcommmic").hide();
                    $("#selectedcommtext").show();
                }

                //TO--DO : add status (similar to backend) Status

                //History - ping the server
                $.getJSON(Flask.url_for("history"), {'cid' : latest_json[2][j]['cid'], 'type': 'PLANE'})
                    .done(function(data, textStatus, jqXHR) {
                        google.charts.setOnLoadCallback(function() {
                            //To hold the data
                            var chart_data = new google.visualization.DataTable();

                            //Add columns
                            chart_data.addColumn('number', 'Time');
                            chart_data.addColumn('number', 'Altitude');
                            chart_data.addColumn('number', 'Speed');

                            //Loop through JSON data to add rows
                            for (var m = 0; m < data.length; m++) {
                                chart_data.addRows([[data[m][0]/3600, data[m][1], data[m][2]]]);
                            }

                            //Options for the chart
                            var chart_options = {
                                title: 'History',
                                // Gives each series an axis that matches the vAxes number below.
                                series: {
                                  0: {targetAxisIndex: 0},
                                  1: {targetAxisIndex: 1}
                                },

                                vAxes: {
                                  // Adds titles to each axis.
                                  0: {title: 'Altitude (ft)'},
                                  1: {title: 'Speed (kts)'}
                                },
                            };

                        var chart = new google.visualization.LineChart(document.getElementById('selectedplanehistory'));
                        chart.draw(chart_data, chart_options);
                        });
                    });
            }
        }
    }
    //Focus on first tab
    $(".content-buttons").removeClass("active");
    $('#home').addClass("active");
    $(".content-div").fadeOut('fast');
    $(".content-div#home").fadeIn('fast');
}

function humanizeTime(time) {
    //Make time human readable
    var t = time.substr(0, 4) + '-' + time.substr(4, 2) + '-' + time.substr(6, 2) + ' ';
    return t + time.substr(8, 2) + ':' + time.substr(10, 2) + ':' + time.substr(12, 4) + ' Z';
}

function distance(lon1, lat1, lon2, lat2) {
    //Haversine formula for calculating the great circle distance between two points Copied from backend version
    //convert decimal degrees to radians
    var orig = [lon1, lat1, lon2, lat2];
    var rad_lats = orig.map(function(x) {
        return x * Math.PI / 180;
    });

    var dlon = rad_lats[2] - rad_lats[0];
    var dlat = rad_lats[3] - rad_lats[1];

    var a = (Math.sin(dlat/2)*Math.sin(dlat/2)) + Math.cos(rad_lats[1]) * Math.cos(rad_lats[3]) * (Math.sin(dlon/2)*Math.sin(dlon/2));
    var c = 2 * Math.asin(Math.sqrt(a));
    var km = 6367 * c;
    return km;
}

function removeMarkers() {
    for (var i = 0, aplen = airports.length; i < aplen; i++) {
        airports[i].setMap(null);
    }
    airports = [];

    for (var i = 0, plen = planes.length; i < plen; i++) {
        planes[i].setMap(null);
    }
    planes = [];

    for (var i = 0, clen = centers.length; i < clen; i++) {
        centers[i].setMap(null);
    }
    centers = [];


    //Hide all airport lines
    for (var i = 0; i < airportLines.length; i++) {
        airportLines[i].setMap(null);
    }
    airportLines = [];

    //Hide all airport circles
    for (var i = 0; i < airportCircles.length; i++) {
        airportCircles[i].setMap(null);
    }
    airportCircles = [];
}


function showHoverWindow(data) {
    $(".hoverinfo").html(data);
    $(".hoverwindow").css({
        "display": "inline",
        "top": mouseY + 5,
        "left": mouseX + 10
    });
}

function hideHoverWindow() {
    if (selected_airport !== -1 || selected_plane !== -1 || selected_center !== -1) {
        //something is selected already, so let's reset the information pane
        $("#selectedairport").css("display", "none");
        $("#selectedplane").css("display", "none");
        $("#poitext").text('');
        $("#help").text('Click on a plane or airport to show more information here!');
    }
    selected_airport = -1;
    selected_plane = -1;
    selected_center = -1;
}



/*
 * Configures application.
 */
function configure() {
    //Hide hover window if we click on the map (not a marker)
    google.maps.event.addListener(map, "click", function() {
        hideHoverWindow();
    });


    // update UI after map has been dragged
    google.maps.event.addListener(map, "dragend", function() {
        update();
    });

    // update UI after zoom level changes
    google.maps.event.addListener(map, "zoom_changed", function() {
        //Zoom the map Circles proportionately to the current zoom level
        if (map.getZoom() !== 0) {
            airportCircles.forEach(function(airport) {
                airport.setRadius(airport.baseSize * (1 / map.getZoom()) * 6);
            });
        }
        update();
    });

    // update UI
    update();
}


/**
 * Updates UI's markers.
 */
function update() {
    // get places (asynchronously)
    $.getJSON(Flask.url_for("update")) //, parameters)
        .done(function(data, textStatus, jqXHR) {
            //check to see if update needed
            if (data[3][0]["time_updated"] - update_time === 0) {
                //No change
                console.log("No change detected!")
                return null;
            }

            //Update local cache
            latest_json = data;

           // remove old markers from map
            removeMarkers();

            //Clear the onlines tables
            $("#tablefilterATC tbody").html("");
            $("#tablefilterpilot tbody").html("");

            // update the airports
            for (var i = 0, mlen = data[0].length; i < mlen; i++) {
                addAirport(data[0][i]);
            }
            //Draw centers
            for (var i = 0, clen = data[1].length; i < clen; i++) {
                addCenter(data[1][i]);
            }
            //Update the planes!
            for (var i = 0, plen = data[2].length; i < plen; i++) {
                addPlane(data[2][i]);
                data[2][i]['markerIndex'] = planes.length - 1;
            }

            //Filter the online users, based on what was entered in filter box
            filterOnlines($("#filtertext").val());

            //Update stats
            updateStats();

            //Update worst weather table
            updateWorstWeather();

            console.log("Redrew map at " + data[3][0]["time_updated"]);
            update_time = data[3][0]["time_updated"];
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            // log error to browser's console
            console.log(errorThrown.toString());
        });
}

function filterOnlines(filtertext) {
    //This function filters the ONLINE tab's tables based on whatever value is provided
    var tableIDs = ["tablefilterATC", "tablefilterpilot"];
    //Loop through the two tables in the tableIDs array
    tableIDs.forEach(function(val) {
        //for coloring rows odd vs even
        var counter = 0;
        //val is the tableID being looked at currently
        var table = document.getElementById(val);
        //Loop through rows
        for (var i = 0, row; row = table.rows[i]; i++) {
        //if header row, then don't filter (continue), and force it to show block
            if (i === 0) {
                row.style.display = "table-row";
                continue;
            }
            //show keeps track of whethter to show the current row or not
            var show = false;
            //Loop through cells in current row
            for (var j = 0, col; col = row.cells[j]; j++) {
            //See if there is a match
                if (col.innerHTML.toString().toLowerCase().indexOf(filtertext.toLowerCase()) !== -1) {
                    show = true;
                }
            }
            //Increment the counter if this row is being shown
            if (show === true) {
                counter += 1;

                //This row's plane must be shown
                if (val === "tablefilterpilot") {
                    //Show the ATC; first column contains ID number of plane (in planes[] array)
                    planes[parseInt(row.cells[0].innerHTML) - 1].setMap(map);
                }
            } else {
                //This row's plane must be hidden
                if (val === "tablefilterpilot") {
                    //Hide the ATC; first column contains ID number of plane
                    planes[parseInt(row.cells[0].innerHTML) - 1].setMap(null);
                }
            }
            //add hide to the row if needed
            row.className = (show === true ? "" : "hidden");
       }
    });
}

function get_metar(stationid) {
    //Contact server to return station ID data
    $.getJSON(Flask.url_for("metar"), {
        station: stationid
    })
    .done(function(data, textStatus, jqXHR) {
        //console.log(data);
        if (data === null) {
            $("#metarresults_stationID").text('METAR for ' + stationid + ' is not available.');
            $("#metardetails").hide();
        } else {
            $("#metarresults_stationID").text('METAR for ' + data['stationID']);
            $("#metarresults_category").text(data['category']);
            $("#metarresults_rawtext blockquote span").text(data['raw_text']);

            $("#metarresults_time").append(data['time']);
            $("#metarresults_winddirspeed").append('<img src="' + imgs[Math.round(data["wind_dir"] / 10) % 36] + '"/>   (' + data['wind_dir'] + ')  ' +  data['wind']);
            $("#metarresults_clouds").append(data['clouds']);
            $("#metarresults_visibility").append(data['visibility']);
            $("#metarresults_tempdewpoint").append(data['temp']);
            $("#metarresults_altimeter").append(data['altimeter']);
            $("#metarresults_sealevelpressure").append(data['sealevelpressure']);
            $("#metardetails").show();
        }
    });
}

setInterval(function(){
    var d = new Date();
    var hrs = d.getUTCHours() > 9 ? d.getUTCHours() : '0' + d.getUTCHours();
    var min = d.getUTCMinutes() > 9 ? d.getUTCMinutes() : '0' + d.getUTCMinutes();
    var sec = d.getUTCSeconds() > 9 ? d.getUTCSeconds() : '0' + d.getUTCSeconds();
    $(".time").text(hrs + ':' + min + ":" + sec + ' Z ');

    updateCounter += 1
    if (updateCounter > 60) {
        updateCounter = 0;
    }
    //Set autoupdate counter
    if (document.getElementById('autoupdate').checked) {
        $("#autoupdatecounter").removeClass("hidden");
        $("#autoupdatecounter").text(60 - parseInt(updateCounter));
    } else {
        $("#autoupdatecounter").addClass("hidden");
    }

}, 1000);

//Auto update
setInterval(function() {
    if (document.getElementById('autoupdate').checked) {
        update();
    }
}, 60000);


function longitudnalDisplacement(distX, currLatitude, heading) {
    //Receives current latidude, heading (in deg) a plane is going at, and how much X distance (in km) it is moving, and returns
    //the number of degrees to add or subtract to current longitude, to get the new longitude
    //Convert currnt latitude to radians
    currLatitude = Math.abs(currLatitude) * Math.PI / 180;
    //Use Mercator projection ellipsoidal data to determine length of a longitude, at planes given latitude
    var deltaLon = (Math.PI * 6378137 * Math.cos(currLatitude) / (180 * Math.sqrt(1 - (0.0066943799901 * Math.pow(Math.sin(currLatitude), 2))))) / 1000;
    //How many longitudes is the plane going to move
    var lonChange = distX / deltaLon;
    //If we're heading west, then we need to subtract the longitudes, otherwsie, add them
    if (heading > 180) {
        lonChange *= -1;
    }
    return lonChange;
}

function latitudnalDisplacement(distY, currLatitude, heading) {
    //Receives current latitude, heading (in deg) a plane is goin at, how much distance (in km) it is moving, and it returns the
    //number of degrees to add or subtract to current latitude, to get new latitude
    currLatitude = Math.abs(currLatitude) * Math.PI / 180;
    var deltaLat = (Math.PI * 6378137 * (1 - 0.0066943799901)) / (180 * (Math.pow((1 - (0.0066943799901 * Math.pow(Math.sin(currLatitude), 2))), 3/2))) / 1000;
    var latChange = distY / deltaLat;
    if (heading >= 90 && heading <= 270) {
        latChange *= -1;
    }
    return latChange;
}

//Auto update plane positions every second
setInterval(function() {
    var currAngle, currSpeed, currDistance, oldLat, oldLon, distX, distY, newLat, newLon, trigAngle;
    var sinY = false;

    //Loop through each plane, and update location
    for (var i = 0; i < latest_json[2].length; i++) {
        currAngle = parseFloat(latest_json[2][i]['heading']);
        currSpeed = parseFloat(latest_json[2][i]['speed']);
        oldLat = parseFloat(latest_json[2][i]['latitude']);
        oldLon = parseFloat(latest_json[2][i]['longitude']);

        //Ignore grounded planes, and those taxiing based on current speed
        if (currSpeed > 30) {
            //Distance in kilometers
            currDistance = (currSpeed / 0.53995680345572) * (1 / 3600);
            //Determine how much x and y displacement there is, based on heading; trigonometric angle is different from true heading,
            //Draw on paper to see why; boolean is used to determine whether sin would mean X or mean Y.
            var angleDict = {90: true, 135: true, 180: false, 225: false, 270: true, 315: true, 360: false};

            //If angle is less than 45, then it's ok to use as is for trigonometry
            if (currAngle <= 45) {
                trigAngle = currAngle;
                sinY = false;
            } else {
                //Otherwise, find lowest angle (angleDict is 'sorted') and set sinY based on that, and correct angle for trig purpose
                for (var angle in angleDict) {
                   if (currAngle <= angle) {
                        trigAngle = angle - currAngle;
                        sinY = angleDict[angle];
                        break;
                    }
                }
            }
            //Determine x and y distances
            if (sinY === false) {
                distY = Math.abs(Math.cos(trigAngle * Math.PI / 180) * currDistance);
                distX = Math.abs(Math.sin(trigAngle * Math.PI / 180) * currDistance);
            } else if (sinY === true) {
                distY = Math.abs(Math.sin(trigAngle * Math.PI / 180) * currDistance);
                distX = Math.abs(Math.cos(trigAngle * Math.PI / 180) * currDistance);
            }

            newLon = oldLon + longitudnalDisplacement(distX, oldLat, currAngle);
            newLat = oldLat + latitudnalDisplacement(distY, oldLat, currAngle);

            latest_json[2][i]['latitude'] = newLat;
            latest_json[2][i]['longitude'] = newLon;

            var latlng = new google.maps.LatLng(newLat, newLon);
            planes[latest_json[2][i]['markerIndex']].setPosition(latlng);
        }
    }
}, 1000);


function updateWorstWeather() {
    var airport = '';
    var apts_tmp = {};
    for (var i = 0; i < latest_json[0].length; i++) {
        if (latest_json[0][i]['atc'].length !== 0) {
            airport += ' ' + latest_json[0][i]['icao'];
            apts_tmp[latest_json[0][i]['icao']] = [latest_json[0][i]['id'], latest_json[0][i]['name']];
        }
    }

    $.getJSON(Flask.url_for("worstweather"), {
        airports: airport
    })
    .done(function(data, textStatus, jqXHR) {
        $("#worstweather tbody").html('');
        for (var i = 0; i < data.length; i++) {
            var max = -10;
            var ind = null;
            var table_data = '';

            for (var k = 0; k < data.length; k++) {
                if (data[k]['total_score'] > max) { // || max === null) {
                    if (data[k]['precipitation'] === null) {
                        data[k]['precipitation'] = "None";
                    }
                    max = data[k]['total_score'];
                    ind = k;
                }
            }
            var tmp = data[ind];
            //Draw max one in table
            table_data += '<tr><td><a href = "#" onclick="centerMap(' + apts_tmp[tmp['airport']][0] + ', 0);">' + tmp['airport'] + '</a><span class = "worstweatherhover">' + apts_tmp[tmp['airport']][1] + '</span></td>';
            table_data += '<td class="text-center">' + tmp['precipitation_score'] + '<span class = "worstweatherhover">' + tmp['precipitation'] + '</span></td>';
            table_data += '<td class="text-center">' + tmp['temperature_score'] + '<span class = "worstweatherhover">' + tmp['temperature'].replace('/', '<br>/<br>') + '</span></td>';
            table_data += '<td class="text-center">' + tmp['visibility_score'] + '<span class = "worstweatherhover">' + tmp['visibility'] + '</span></td>';


            table_data += '<td class="text-center">' + tmp['wind_score'] + '<span class = "worstweatherhover">' + tmp['wind'] + '</span></td>';
            table_data += '<td class="text-center">' + tmp['total_score'] + '</td>';
            $("#worstweather tbody").append(table_data);

            data[ind]['total_score'] = null;
        }
    });
}

function planFlight() {
    //Looks at current possible routes (all online airports) and determines which planes can fly those routes!
    $("#planningplane").css("display","none");
    //Reset the Selected Plane text (because we are redrawing the table with options, and nothing will be selected after this functin)

    //temporary variable with all active airports (with ATC)
    var activeAirports = [];
    //This array will store objects of text and google map polylines (used for hovering over routes)
    //[{text: 'KLGA-KDCA', dist: 1000, marker: map_object}, ...]
    planningRoutes = [];
    //Reset all planes (planes[4] holds route indices of planningRoutes object based on which routes are active)
    for (var plane in planeOptions) { planeOptions[plane][4] = []; }

    //Determine all active airports
    for (var i = 0; i < latest_json[0].length; i++) {
        //if the current airport is active (has ATC available)
        if (latest_json[0][i]['atc'].length !== 0) {
            //Add object to active airports
            activeAirports.push(latest_json[0][i]);
        }
    }

    for (var i = 0; i < activeAirports.length - 1; i++) {
        for (var j = i + 1; j < activeAirports.length - 1; j++) {
            //Add route to array
            var tmpTxt = activeAirports[i]['icao'] + '-' + activeAirports[j]['icao'];
            var tmpNames = activeAirports[i]['name'] + '</br>to</br>' + activeAirports[j]['name'];
            var tmpDis = distance(activeAirports[i]['longitude'], activeAirports[i]['latitude'], activeAirports[j]['longitude'], activeAirports[j]['latitude']);
            var tmpMarker = new google.maps.Polyline({
                path: [{lat: activeAirports[i]['latitude'], lng: activeAirports[i]['longitude']}, {lat: activeAirports[j]['latitude'], lng: activeAirports[j]['longitude']}],
                geodesic: false,
                strokeColor: '#0000FF',
                strokeOpacity: 1.0,
                strokeWeight: 5,
                map: null,
                zIndex: 999
            });
            if (tmpDis < 20) { continue; }

            planningRoutes.push({text: tmpTxt, dist: tmpDis, names: tmpNames, marker: tmpMarker});

            //Loop through all planes
            for (var plane in planeOptions) {
                //Round the route time to nearest 10
                var routeTime = Math.floor(((tmpDis / (planeOptions[plane][2] * 1.852) * 60) + 50) / 10) * 10;
                if ((planeOptions[plane][3] >= (tmpDis * 0.5399)) && (routeTime <= $('#planningrangebar').val())) {
                    planeOptions[plane][4].push(planningRoutes.length - 1);
                }
            }
        }
    }

    //Write planes (the header row of the planning table)
    var tmp = '<form action=\'\'><thead><tr><td>&nbsp;&nbsp;&nbsp;</td>';
    for (var plane in planeOptions) {
        if (planeOptions[plane][0] !== $("#planningplanes").val() || planeOptions[plane][4].length === 0 || $("#planningplanes").val() === "None") {
            continue;
        }
        tmp += '<td class=\'planningvertical\'>' + plane + '</td>';
    }
    tmp += '</tr></thead><tbody>';

    //Loop through routes, and write planes as needed - this isthe body of the table
    for (var i = 0; i < planningRoutes.length; i++) {
        var writePlane = false;
        var rows = '';

        for (var plane in planeOptions) {
            //Only write those planes
            if (planeOptions[plane][0] !== $("#planningplanes").val()) {
                continue;
            }

            if (planeOptions[plane][4].indexOf(i) !== -1) {
                rows += '<td class = \'planninggreen\'><input type=\'radio\' class = \'blah\' name=\'planningtable\' value=\'' + i + ';' + plane + '\'></td>';
                writePlane = true;
            } else {
                rows += '<td class = \'planningred\'>&nbsp;</td>';
            }
        }
        //Should we write it?
        if (writePlane === true) {
            tmp += '<tr><td class=\'planningroutetext\'><span class=\'hidden\'>' + i;
            tmp += '</span><span class=\'hoverwindow text-center hidden\'>Distance: ' + parseInt(planningRoutes[i]['dist']) + ' km</br> ';
            // tmp += '</span><span class=\'planningtabletext\'>Distance: ' + parseInt(planningRoutes[i]['dist']) + ' km</br> ';
            tmp += planningRoutes[i]['names'] + '</span>' + planningRoutes[i]['text'] + '</td>' + rows + '</tr>';
        }
    }

    tmp += '</tbody></form>';
    console.log(tmp);
    $('#planningresults').html(tmp);

    $('.planningroutetext').hover(function() {
        //Show the route, and zoom the map in
        planningRoutes[parseInt($(this).find('span')[0]['innerHTML'])]['marker'].setMap(map);
        for (var i = 0; i < planes.length; i++) {
            planes[i].setMap(null);
        }
        //Record old zoom and location
        planningOldZoom['center'] = map.getCenter();
        planningOldZoom['zoom'] = map.getZoom();

        //Create bound and add position of markers to it
        var tmpBounds = new google.maps.LatLngBounds();
        planningRoutes[parseInt($(this).find('span')[0]['innerHTML'])]['marker'].getPath().forEach(function(e){
            //can't do polyline.getPath()[i] because it's a MVCArray
            tmpBounds.extend(e);
        });

        //Fit the bounds
        map.fitBounds(tmpBounds);

        //Zoom out, depending on distance (for nice view)
        if (planningRoutes[parseInt($(this).find('span')[0]['innerHTML'])]['dist'] < 1500) {
            map.setZoom(map.getZoom() - 3);
        } else if (planningRoutes[parseInt($(this).find('span')[0]['innerHTML'])]['dist'] < 3000) {
            map.setZoom(map.getZoom() - 2);
        } else {
            map.setZoom(map.getZoom() - 1);
        }
    }, function() {
        //Hide the marker
        planningRoutes[parseInt($(this).find('span')[0]['innerHTML'])]['marker'].setMap(null);
        //Show the planes
        for (var i = 0; i < planes.length; i++) {
            planes[i].setMap(map);
        }

        map.setCenter(planningOldZoom['center']);
        map.setZoom(planningOldZoom['zoom']);
    });


        //When a route is picked on planmning screen
    $(".planninggreen input").on("click", function() {
        //.get(0) gets the JavaScript DOM element rather than jQuery object
        $("#planningplane").css("display","block");
        $("#planningselectedflight").get(0).scrollIntoView();

        $("#planningplaneleft .deparricao").html(planningRoutes[ parseInt( $(this).val().split(";")[0] ) ]['text'].split("-")[0]);
        $("#planningplaneleft .deparrname").html(planningRoutes[ parseInt( $(this).val().split(";")[0] )   ]['names'].split("to")[0]);

        $("#planningplaneright .deparricao").html(planningRoutes[ parseInt( $(this).val().split(";")[0] ) ]['text'].split('-')[1]);
        $("#planningplaneright .deparrname").html(planningRoutes[ parseInt( $(this).val().split(";")[0] )   ]['names'].split("to")[1]);

        tmp = "<strong>Distance</strong>: " + parseInt(planningRoutes[parseInt($(this).val().split(";")[0])]['dist']) + ' km';
        tmp += '<br><strong>Plane Chosen</strong>: ' + planeOptions[$(this).val().split(";")[1]][1];
        tmp += '<br><strong>Range for Plane</strong>: ~' + parseInt(planeOptions[$(this).val().split(";")[1]][3] / 0.52) + ' km';
        $("#planningplane p").html(tmp);
    });

}
function clearPlanning() {
    //Reset dropdown for planning planes
    document.getElementById("planningplanes").selectedIndex = 0;
    //Reset planning range bar
    $("#planningrangebar").val(30);
    //Force change event (so value can get updated)
    $("#planningrangebar").trigger("change");
    //Plan "new flight"
    planFlight();

}
function updateStats() {
    //This updates the STATS paragraph on Main tab with number of users online, etc.
    var updateText = "";

    var untowered = 0;
    var busiest = {name: '', arrivals: 0, departures: 0, index: null};

    for (var i = 0; i < latest_json[0].length; i++) {
        if (latest_json[0][i]['atc'].length === 0) {
            untowered += 1;
        }
        if ((busiest.arrivals + busiest.departures) < (latest_json[0][i]['arrplanes'].length + latest_json[0][i]['depplanes'].length) && latest_json[0][i]['icao'] !== null) {
            busiest.name = latest_json[0][i]['icao'];
            busiest.arrivals = latest_json[0][i]['arrplanes'].length;
            busiest.departures = latest_json[0][i]['depplanes'].length;
            busiest.index = latest_json[0][i]['id'];
        }
    }
    var atc = latest_json[0].length - untowered;
    updateText += "<p class='compact-table text-smaller'><span>Towered Airports</span> " + atc + "</p>";
    updateText += "<p class='compact-table text-smaller'><span>Untowered Airports</span> " + untowered + "</p>";
    updateText += "<p class='compact-table text-smaller'><span>Busiest Airport</span> <a href=\"#\" onclick=\"centerMap(" + busiest['index'] + ",0);\">" + busiest['name'] + '</a>  - ' + busiest['arrivals']   + ' Arrivals, ' + busiest['departures'] + ' Departures</p>';

    //Centers online; 0 is the initial value of array
    var tot = latest_json[1].reduce(function(accumulator, currentVal) {
        return accumulator + currentVal['atc'].length;
    }, 0);
    updateText += "<p class='compact-table text-smaller'><span>Center ATC Online</span> " + tot + "</p>";
    updateText += "<p class='compact-table text-smaller'><span>Total Pilots Online</span> " + latest_json[2].length + "</p>";

    $('#stats').html(updateText);
}
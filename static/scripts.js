// Holds Google Map
var map;
//Stores all the airports and planes on map currently, as GoogleMap marker objects
var airports = [];
var planes = [];
//Copy of the data fetched from server   //time of last update (stored in latest json)
var latest_json = [];
var update_time = 0;
//Currently clicked on airport's index
var selected_airport = -1;
var selected_plane = -1;
//Global variable for current mouse position; Google map listeners supposedly don't supply event.pageX values?
var mouseX;
var mouseY;
//Array
var airportLines = [];
var flightPath;
var airportCircles = []
//holds latest weather
var latest_weather;
var single_weather;
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
    
}

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
    $(window).scroll(function() {
       $("#map-canvas").css('top', $(window).scrollTop() + 65 + 'px');
    });

    //Charting function for plotting speed and altiitude vs time    
    google.charts.load('current', {packages: ['corechart', 'line']});
    
    //show hide ATC and Pilots on ONLINE page
    $('.showHideATC').on('click', function () {
        $('.showHideATC').toggle();
        $('#tablefilterATC').fadeToggle('fast');
    })

    $('.showHidePilot').on('click', function () {
        $('.showHidePilot').toggle();
        $('#tablefilterpilot').fadeToggle('fast');
    })
    
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

    $("#get_metar").on("click", function() {
        get_metar($("#metarquery").val());
    })
    
    //Get worst weather when weather is clicked
    $("#wx").on('click', function() {
       console.log(updateWorstWeather());
       //TO--DO: fix this thing later
    });

});

//Add listener for global mouse position; used to display hover window next to mouse
$(document).on('mousemove', function(event) {
    mouseX = 0;//event.pageX;
    mouseY = 0;//event.pageY;
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
        //hideHoverWindow();
      //  $("#hoverwindow").css("display", "inline")
        selected_plane = data["id"]
        showSelectedInfo();
    });


    m.addListener('mouseover', function() {
        //only if no airport is clicked upon, then show the hover for this
     //   if (selected_plane === -1 && selected_airport === -1) {
            $("#hoverinfo").html(prettifyPlaneData(data));
            $("#hoverwindow").css({
                "display": "inline",
                "top": mouseY + 5,
                "left": mouseX + 10
            });
    
    

        //Get origin and destination locations
        for (var j = 0; j < latest_json[0].length; j++) {
            if (latest_json[0][j]["id"] === data["depairport_id"]) {
                d_coord = {
                    lat: latest_json[0][j]["latitude"],
                    lng: latest_json[0][j]["longitude"]
                };
            }
            if (latest_json[0][j]["id"] === data["arrairport_id"]) {
                a_coord = {
                    lat: latest_json[0][j]["latitude"],
                    lng: latest_json[0][j]["longitude"]
                };
            }
        };
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
            prev_point_lat = flightPlanCoordinates[flightPlanCoordinates.length - 1]['lat'];
            prev_point_lng = flightPlanCoordinates[flightPlanCoordinates.length - 1]['lng'];
            curr_point_lat = tmppush['lat'];
            curr_point_lng = tmppush['lng'];
            
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
            };
            flightPlanCoordinates.push(tmppush);
        };
        
        //add arrival airport coordinates
        flightPlanCoordinates.push(a_coord);
        

        flightPath = new google.maps.Polyline({
            path: flightPlanCoordinates,
            geodesic: false,
            strokeColor: '#FF000',
            strokeOpacity: 1.0,
            strokeWeight: 2,
            map: map
        });





    });

    m.addListener('mouseout', function() {
        //if nothing has been clicked on, then hide the info window (ALSO SEE CONFIGURE FUNCTION FOR CLICK EVENT LISTERNERS!)
        // hideHoverWindow();
        flightPath.setMap(null);

       // if (selected_plane === -1 && selected_airport === -1) {
            $("#hoverwindow").css("display", "none");
            //hideHoverWindow();
        //}


    });
    //add current marker to airports array
    planes.push(m);

    //Update online table
    //MADE CHANGE HERE
    $("#tablefilterpilot tbody").append("<tr><td class='tablefilterhide'>" + data['id'] + "</td><td>"+data['callsign']+"</td><td>"+data['real_name']+"</td><td>"+data['depairport']+"</td><td>"+data['arrairport']+"</td><td><a href=\"#\" onclick=\"centerMapOnPlane("+data['id']+")\">Show</a></td></tr>");


}



function addATCMarker(type, latitude, longitude){
    //This function adds a marker of the given size at the given latitude and longitude
    //Type definitions are as defined in the backend (0 for ATIS, 1 CLNC, etc.)
    //For radii of circles
    if (type === 5 || type === 6) {
        return;
    }
    radii = {
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
    airportCircles.push(Circle);
}

//called as JSON data is being parsed, to add marker to map
function addAirport(data) {
    //create latitude and longitude
    var lls = new google.maps.LatLng(parseFloat(data["latitude"]), parseFloat(data["longitude"]));
    var image = "http://conferences.shrm.org/sites/all/themes/sessions/images/dot76923C.png";
    
    if (data["atc"].length !== 0) {
        //There is ATC so lets draw circles!
        for (var i = data["atc_pic"].length - 1; i > -1; i--) {
                addATCMarker(data["atc_pic"][i], data['latitude'], data['longitude']);
        }
    }
        
        //Loop through each ATC and add to online table
        data['atc'].forEach(function(val) {
            //Update online table
            //MADE CHANGE HERE
            $("#tablefilterATC tbody").append("<tr><td class='tablefilterhide'>" + data['id'] +  "</td><td>"+data['name']+"</td><td>"+val['callsign']+"</td><td>"+val['freq']+"</td><td>"+val['name']+"</td></tr>");
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
        selected_airport = data["id"];
        showSelectedInfo();
    });

    m.addListener('mouseover', function() {
    //only if no airport is clicked upon, then show the hover for this
//        if (selected_plane === -1 && selected_airport === -1) {
            $("#hoverinfo").html(prettifyAirportData(data));
            $("#hoverwindow").css({
                "display": "inline",
                "top": mouseY + 5,
                "left": mouseX + 10
            });

        //Draw lines
        for (var i = 0, deplen = data["depplanes"].length; i < deplen; i++) {
            //create marker
            for (var j = 0; j < latest_json[2].length; j++) {
                if (latest_json[2][j]["id"] === data["depplanes"][i]) {
                    var coord = {
                        lat: latest_json[2][j]["latitude"],
                        lng: latest_json[2][j]["longitude"]
                    };
                }
            };

            var flightPlanCoordinates = [{
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
                    var coord = {
                        lat: latest_json[2][j]["latitude"],
                        lng: latest_json[2][j]["longitude"]
                    };
                }
            }

            var flightPlanCoordinates = [{
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

    });

    m.addListener('mouseout', function() {
        //if nothing has been clicked on, then hide the info window (ALSO SEE CONFIGURE FUNCTION FOR CLICK EVENT LISTERNERS!)
        $("#hoverwindow").css("display", "none");

//        if (selected_plane === -1 && selected_airport === -1) {
  //          hideHoverWindow();
    //    }
        //Hide all airport lines
        for (var i = 0; i < airportLines.length; i++) {
            airportLines[i].setMap(null);
        }
        airportLines = [];
    });

    //add current marker to airports array
    airports.push(m);
}


function centerMapOnPlane(id) {
    //Centers the map on the plane with the ID supplied
    //loop through the latest json to find the plane first
    for (var i = 0; i < latest_json[2].length; i++) {
        if (latest_json[2][i]['id'] === id) {
            //Found the plane in question, lets center the map onto it!
            map.setZoom(9);
            map.setCenter(new google.maps.LatLng(parseFloat(latest_json[2][i]['latitude']), parseFloat(latest_json[2][i]['longitude'])));
        }
    }
}

function prettifyPlaneData(data) {
    //Returns displayable HTML for info window
    return "<h4>" + data["callsign"] + "</h4>" + "<p>" + data["depairport"] + " -> " + data["arrairport"] + "</p>";
}



function prettifyAirportData(data) {
    //Returns displayable HTML for info window
    var r = "<span id='infoWindowTitle'>" + data["name"] + "</span></br>";
    r += "<span>(" + data["icao"] + ")</span></br></br>";

    r += "<table><tr><td><span>Altitude</span></td>" + "<td>" + data["altitude"] + " ft</td></tr>";
    r += "<tr><td><span>Arrivals</span></td>" + "<td>" + data["arrplanes"].length + "</td></tr>";
    r += "<tr><td><span>Departures</span></td>" + "<td>" + data["depplanes"].length + "</td></tr>";

    //r += "<span>Arrivals</span> " + data["arrplanes"].length + "</br>";
    //r += "<span>Departures</span> " + data["depplanes"].length + "</br>";

    r += "<tr><td><span id='infowindowatc'>ATC</span></td></tr>";
    if (data["atc"].length === 0) {
        r += "<tr><td>No ATC currently online</td></tr>";
    } else {
        for (var i = 0, atclen = data["atc"].length; i < atclen; i++) {
            r += "<tr><td><span>" + data["atc"][i]["callsign"] + "</span></td>" + "<td>" + data["atc"][i]["freq"] + "</td></tr>";
            //    r += "<span> " + data["atc"][i]["callsign"] + "</span> " + data["atc"][i]["freq"]  + "</br>";
        }
    }
    r += "</table>";
    return r;
}

function showSelectedInfo() {
    ///This function writes the currently selected airplane or airport's iforation to the main tab!
    //Update the airplane data from JSON
    update();
    
    //if an airport is selected, then ship its data out
    if (selected_airport !== -1) {
        $("#selectedairport").show();
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
                $("#help").html(latest_json[0][j]['name'] + '<br/>Altitude: ' + latest_json[0][j]['altitude'] + ' ft');
                
                //Set latitude and longitude
                selectedlat = latest_json[0][j]['latitude'];
                selectedlon = latest_json[0][j]['longitude'];
                selectedalt = latest_json[0][j]['altitude']
                
                //Populate ATC information
                var atc_html = "";
                if (latest_json[0][j]['atc'].length === 0) {
                    atc_html = "<h5>No ATC online</h5>"
                } else {
                    var tmp = latest_json[0][j]['atc'];
                    tmp.forEach(function(val) {
                        atc_html += "<h5>" + val['callsign'] + "</h5>";
                        atc_html += "<p><strong>Frequency</strong>" + val['freq'] + "</p>";
                        atc_html += "<p><strong>Name and ID</strong>" + val['name'] + " (CID " + val['cid'] + ")</p>";
                        atc_html += "<p><strong>Message</strong>" + val['atismsg'] + "</p>";
                        atc_html += "<p><strong>Logon Time</strong>" + val['timelogon'] + "</p>";
                       
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
                var status;
                
            //Calculate status
            if (dist < 20 && tmpSpeed === 0 && Math.abs(selectedalt - tmpPlaneAlt) < 50) {
                status = "In terminal";
            } else if (dist < 20 && tmpSpeed > 0 && Math.abs(selectedalt - tmpPlaneAlt) < 50) {
                status = "Taxiing"
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
                tmp = '<td><a href="#" onclick="centerMapOnPlane(' + latest_json[2][j]['id'] + ')">';
                tmp += latest_json[2][j]['callsign'] + "</a></td>";
                tmp += "<td>" + latest_json[2][j]['deptime'] + "</td>";
                tmp += "<td>" + latest_json[2][j]['arrairport'] + "</td>";
                tmp += "<td>" + latest_json[2][j]['altitude'] + "</td>";
                tmp += "<td>" + latest_json[2][j]['speed'] + " </td>";
                tmp += "<td>" + latest_json[2][j]['heading'] + "</td>";
                tmp += "<td>" + latest_json[2][j]['aircraft'] + "</td>";
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
            
                tmp = '<td><a href="#" onclick = "centerMapOnPlane(' + latest_json[2][j]['id'] + ')">' 
                tmp += latest_json[2][j]['callsign'] + "</a></td>";
                tmp += "<td>" + latest_json[2][j]['depairport'] + "</td>";
                tmp += "<td>" + dist + "</td>";
                tmp += "<td>" + latest_json[2][j]['altitude'] + "</td>";
                tmp += "<td>" + latest_json[2][j]['speed'] + "</td>";
                tmp += "<td>" + latest_json[2][j]['heading'] + "</td>";
                tmp += "<td>" + latest_json[2][j]['aircraft'] + "</td>";
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
    
    } else if (selected_plane !== -1) {
        $("#selectedairport").hide();
        $("#selectedplane").show();

        for (var j = 0, l = latest_json[2].length; j < l; j++) {
            if (latest_json[2][j]["id"] === selected_plane) {
                $("#poitext").text(latest_json[2][j]['callsign']);
                $("#help").text("");

                //Found the plane, lets build up data
                $("#selectedplaneleft .deparricao").html(latest_json[2][j]["depairport"]);
                $("#selectedplaneleft .deparrtime").html(latest_json[2][j]["deptime"]);
                $("#selectedplaneright .deparricao").html(latest_json[2][j]["arrairport"]);
                //latitude and long for arriving departing airpott
                var arrlong, arrlat, deplong, deplat;
                var depaltitude, arraltitude;
                //Find the airport for its name 
                for (var k = 0; k < latest_json[0].length; k++) {
                    if (latest_json[0][k]['id'] === latest_json[2][j]['depairport_id']) {
                        //found the departure airport
                        $("#selectedplaneleft .deparrname").text(latest_json[0][k]['name']);
                        arrlong = parseFloat(latest_json[0][k]['longitude']);
                        arrlat = parseFloat(latest_json[0][k]['latitude']);
                        // depaltitude = parseFloat(latest_json[0][k]['altitude']); USED FOR STATUS - NOT IMPLEMENTED
                    } else if (latest_json[0][k]['id'] === latest_json[2][j]['arrairport_id']) {
                        //found the arrival airport
                        $("#selectedplaneright .deparrname").text(latest_json[0][k]['name']);
                        deplong = parseFloat(latest_json[0][k]['longitude']);
                        deplat = parseFloat(latest_json[0][k]['latitude']);
                        // arraltitude = parseFloat(latest_json[0][k]['altitude']); USED FOR STATUS - NOT IMPLEMENTED
                    }
                }
                //Progress
                //plane longitude/lat    distance travelled and left
                var plong = parseFloat(latest_json[2][j]['longitude']);
                var plat = parseFloat(latest_json[2][j]['latitude']);
                var dist_trav = distance(deplong, deplat, plong, plat);
                var dist_left = distance(plong, plat, arrlong, arrlat);

                //update the progress bar
                $("#selectedprog").css("width", dist_left / (dist_trav + dist_left)*100 + "%");
                
                $("#selectedprogbar span").text(Math.round(dist_left) + ' / ' + Math.round(dist_trav + dist_left) + ' km flown');
                
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
                $("#selectedpilotlogontime").html('<span>Pilot Logon Time</span> ' + latest_json[2][j]['timelogon']);
                $("#selectedpilotremarks").html('<span>Remarks</span> ' + latest_json[2][j]['remarks']);

                //Set voice or text only method (based on remarks from vatsim)
                if (latest_json[2][j]["remarks"].indexOf('/v') != -1) {
                    //Voice enabled!
                    $("#selectedcommmic").show()
                    $("#selectedcommtext").hide()
                } else {
                    $("#selectedcommmic").hide()
                    $("#selectedcommtext").show()
                }

                //TO--DO : add status (similar to backend) Status

                //History - ping the server
                $.getJSON(Flask.url_for("history"), {'cid' : latest_json[2][j]['cid']})
//                        type: 'PLANE'
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
                                /*vAxis: {
                                  viewWindow: {
                                    max: 30
                                  }
                                }*/
                            };

                        var chart = new google.visualization.LineChart(document.getElementById('selectedplanehistory'));
                        chart.draw(chart_data, chart_options);
                        });
                    })                
            }
        }
    }
}

function distance(lon1, lat1, lon2, lat2) {
    //Haversine formula for calculating the great circle distance between two points Copied from backend version
    //convert decimal degrees to radians 
    var orig = [lon1, lat1, lon2, lat2];
    var rad_lats = orig.map(function(x) {
        return x * Math.PI / 180;
    })
    
    var dlon = rad_lats[2] - rad_lats[0];
    var dlat = rad_lats[3] - rad_lats[1];
    
    var a = (Math.sin(dlat/2)*Math.sin(dlat/2)) + Math.cos(rad_lats[1]) * Math.cos(rad_lats[3]) * (Math.sin(dlon/2)*Math.sin(dlon/2));
    var c = 2 * Math.asin(Math.sqrt(a));
    var km = 6367 * c
    return km
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




function hideHoverWindow() {
    //$("#hoverwindow").css("display", "none");
    if (selected_airport !== -1 || selected_plane !== -1) {
        //something is selected already, so let's reset the information pane
        $("#selectedairport").css("display", "none");
        $("#selectedplane").css("display", "none");
        $("#poitext").text('');
        $("#help").text('Click on a plane or airport to show more information here!');
    }
    selected_airport = -1;
    selected_plane = -1;
}



/*
 * Configures application.
 */
function configure() {
    //Hide hover window if we click on the map (not a marker)
    google.maps.event.addListener(map, "click", function() {
        hideHoverWindow();
    });

    //Hide hvoer window if starting drag
/*    google.maps.event.addListener(map, "dragstart", function() {
        hideHoverWindow();
    });*/

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

            //Update the planes!
            for (var i = 0, plen = data[2].length; i < plen; i++) {
                addPlane(data[2][i]);
            }

            //Filter the online users, based on what was entered in filter box
            filterOnlines($("#filtertext").val());
            
            console.log("Redrew map at " + data[3][0]["time_updated"])
            update_time = data[3][0]["time_updated"]
            
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            // log error to browser's console
            console.log(errorThrown.toString());
        })
};

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
                row.style.display = "block";
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
                    planes[parseInt(row.cells[0].innerHTML) - 1].setMap(map)
                }
                 // Uncomment to allow hiding/showing on the map the ATCs; comment to show/hide PLANES only
                 // else {
                 //       //Show the Plane
                 //       console.log('showng plane' + row.cells[0].innerHTML)
                 //       airports[parseInt(row.cells[0].innerHTML) - 1].setMap(map)
                 //   }
            } else {
                //This row's plane must be hidden
                if (val === "tablefilterpilot") {
                    //Hide the ATC; first column contains ID number of plane
                    planes[parseInt(row.cells[0].innerHTML) - 1].setMap(null)
                }
                 // Uncomment to allow hiding/showing on map of ATCs; comment to show hide planes ONLY
                 //else {
                 //       //Hide the Plane
                 //       console.log('hiding plane' + row.cells[0].innerHTML)
                 //       airports[parseInt(row.cells[0].innerHTML) - 1].setMap(null)
                 //   }                    
            }
            //cssclass holds the even vs odd class for the current row
            var cssclass = counter % 2 === 0 ? "onlinetableeven" : "onlinetableodd"
            if (show === true) {
                row.className = "onlinetableshow " + cssclass;
            } else {
                row.className = "onlinetablehide " + cssclass;
            }
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
            $("#metarresults_stationID").text(stationid + ' is not available.');
            $("#metardetails").hide();
        } else {
            $("#metarresults_stationID").text(' for ' + data['stationID']);
            $("#metarresults_category").text(data['category']);
            $("#metarresults_rawtext blockquote span").text(data['raw_text']);
            $("#metarresults_time").text(data['time']);
            
            $("#metarresults_winddirspeed").html('<img src="http://abid.a2hosted.com/plane' + Math.round(data["wind_dir"] / 10) % 36 + '.gif">   (' + data['wind_dir'] + ')  ' +  data['wind']);
            $("#metarresults_clouds").text(data['clouds']);
            $("#metarresults_visibility").text(data['visibility']);
            $("#metarresults_tempdewpoint").text(data['temp']);
            $("#metarresults_altimeter").text(data['altimeter']);
            $("#metarresults_sealevelpressure").text(data['sealevelpressure']);
            $("#metardetails").show();
        }
    });
}

setInterval(function(){
    var d = new Date();
    var hrs = d.getUTCHours() > 9 ? d.getUTCHours() : '0' + d.getUTCHours();
    var min = d.getUTCMinutes() > 9 ? d.getUTCMinutes() : '0' + d.getUTCMinutes();
    var sec = d.getUTCSeconds() > 9 ? d.getUTCSeconds() : '0' + d.getUTCSeconds();
    $("#time").text(hrs + ':' + min + ":" + sec + ' Z ');
    
}, 1000);

//Auto update
setInterval(function() {
    if (document.getElementById('autoupdate').checked) {
        update();
        console.log('autoupdate')
    }
}, 60000);


/*function updateWorstWeather(airport) {
    var type;
    if (!airport) {
        type = 'multi';
        //No airport was supplied, so this means we need to build data for all active airports
        //Gets worst weather from server and updates it
        airport = '';
        for (var i = 0; i < latest_json[0].length; i++) {
            if (latest_json[0][i]['atc'].length !== 0) {
                airport += ' ' + latest_json[0][i]['icao'];
            }
        }
    } else {
        type = 'single';
    }

    $.getJSON(Flask.url_for("worstweather"), {
        airports: airport
    })
    .done(function(data, textStatus, jqXHR) {
        if (type === 'multi') {
            latest_weather = data;
            drawWorstWeather();
        } else {
            single_weather = data;
        }
    });
}


function drawWorstWeather() {
    //draw the worst weather from data variable
    for (var key in latest_weather) {
        var tmp = "<tr><td>"+latest_weather[]
    }
    
    $("#worstweather tbody")
    //Update SPAN (this holds descrupotion of which sortint is currently used)

    //Sort the table

}*/
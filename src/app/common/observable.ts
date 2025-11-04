import { merge, Observable } from "rxjs";
import { map } from "rxjs/operators";

export function toggle(true$: Observable<any>, false$: Observable<any>): Observable<boolean> {
    return merge(
        true$.pipe(map(_ => true)),
        false$.pipe(map(_ => false))
    );
}

import { Alert, Button, Skeleton } from '@/components/ui';
import { getErrorMessage } from '@/utils/errorUtils';

// One data section of a page, in every state, so a page never waits for all its data before showing anything:
//   first load → `skeleton` (shaped like the content; default: three lines), marked busy for screen readers
//   failed, nothing to show → an Alert with the error and Try again (refetches only this section)
//   loaded but empty (`isEmpty(data)`) → `empty`
//   loaded → children(data)
// A failed refresh of data already on screen keeps showing it (the cache still holds it).
// The page's static parts (heading, texts, buttons) render outside, at once; each section has its own boundary,
// so one slow or failing request never holds up or breaks the others.
//
// <QueryBoundary query={useUsers(params)} skeleton={<Skeleton lines={5} />} errorTitle="The users could not be loaded"
//     isEmpty={(data) => data.items.length === 0} empty={<EmptyState title="No users yet" titleAs="p" />}>
//     {(data) => <UserList users={data.items} />}
// </QueryBoundary>
const QueryBoundary = ({ query, skeleton, errorTitle = 'This could not be loaded', isEmpty, empty = null, children }) => {
    if (query.isPending) {
        return <div aria-busy="true">{skeleton ?? <Skeleton lines={3} />}</div>;
    }

    if (query.isError && query.data === undefined) {
        return (
            <Alert
                tone="danger"
                title={errorTitle}
                action={<Button size="sm" variant="secondary" onClick={() => query.refetch()}>Try again</Button>}
            >
                {getErrorMessage(query.error)}
            </Alert>
        );
    }

    if (isEmpty?.(query.data)) {
        return empty;
    }

    return children(query.data);
};

export default QueryBoundary;
